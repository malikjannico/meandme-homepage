<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../../lib/supabase'
import { useContentStore } from '../../../stores/content'

const props = defineProps({ isEditing: Boolean })
const emit = defineEmits(['saved', 'error', 'saving'])

const { t } = useI18n()
const contentStore = useContentStore()

const form = ref({ title_en: '', title_de: '' })
const inspirationImages = ref([])
const uploading = ref(false)
const draggedIndex = ref(null)
const originalData = ref(null)

function loadData() {
  if (contentStore.sectionTitles && contentStore.sectionTitles.length > 0) {
    const section = contentStore.sectionTitles.find(s => s.section_key === 'inspiration')
    form.value = {
      title_en: section?.title_en || '',
      title_de: section?.title_de || ''
    }
    inspirationImages.value = JSON.parse(JSON.stringify(contentStore.inspirationImages || []))
    originalData.value = JSON.parse(JSON.stringify({ ...form.value, images: inspirationImages.value }))
  }
}

async function handleImageUpload(event) {
  const files = Array.from(event.target.files)
  if (files.length === 0) return
  
  emit('saving', true)
  uploading.value = true
  try {
    for (const file of files) {
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileName = `${timestamp}_${randomStr}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      
      const { error: uploadError } = await supabase.storage.from('meandme_assets').upload(`inspiration/${fileName}`, file)
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage.from('meandme_assets').getPublicUrl(`inspiration/${fileName}`)
      
      const { data, error } = await supabase.from('inspiration_images').insert({
        image_url: publicUrl,
        display_order: inspirationImages.value.length
      }).select().single()
      
      if (error) throw error
      inspirationImages.value.push(data)
    }
    await contentStore.fetchAllData()
    emit('saved', 'Bilder hochgeladen')
  } catch (e) {
    emit('error', e.message)
  } finally {
    uploading.value = false
    emit('saving', false)
    event.target.value = ''
  }
}

async function deleteImage(id) {
  if (!confirm('Bild wirklich löschen?')) return
  emit('saving', true)
  try {
    const { error } = await supabase.from('inspiration_images').delete().eq('id', id)
    if (error) throw error
    inspirationImages.value = inspirationImages.value.filter(img => img.id !== id)
    await contentStore.fetchAllData()
    emit('saved', 'Bild gelöscht')
  } catch (e) {
    emit('error', e.message)
  } finally {
    emit('saving', false)
  }
}

async function moveImage(index, direction) {
  const newIndex = direction === 'left' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= inspirationImages.value.length) return
  
  const temp = inspirationImages.value[index]
  inspirationImages.value[index] = inspirationImages.value[newIndex]
  inspirationImages.value[newIndex] = temp
  
  // Re-calculate all display orders
  inspirationImages.value.forEach((img, i) => img.display_order = i)
  
  emit('saving', true)
  try {
    const updates = inspirationImages.value.map((img, idx) => ({
      id: img.id,
      image_url: img.image_url,
      display_order: idx
    }))
    
    const { error } = await supabase.from('inspiration_images').upsert(updates)
    if (error) throw error
    await contentStore.fetchAllData()
  } catch (e) {
    emit('error', e.message)
  } finally {
    emit('saving', false)
  }
}

function handleDragStart(index) {
  draggedIndex.value = index
}

function handleDragOver(event) {
  event.preventDefault()
}

async function handleDrop(index) {
  if (draggedIndex.value === null || draggedIndex.value === index) return
  
  const temp = inspirationImages.value[draggedIndex.value]
  inspirationImages.value[draggedIndex.value] = inspirationImages.value[index]
  inspirationImages.value[index] = temp
  
  inspirationImages.value.forEach((img, i) => img.display_order = i)
  
  emit('saving', true)
  try {
    const updates = inspirationImages.value.map((img, idx) => ({
      id: img.id,
      image_url: img.image_url,
      display_order: idx
    }))
    
    const { error } = await supabase.from('inspiration_images').upsert(updates)
    if (error) throw error
    await contentStore.fetchAllData()
  } catch (e) {
    emit('error', e.message)
  } finally {
    draggedIndex.value = null
    emit('saving', false)
  }
}

function handleTouchStart(index, event) {
  if (!props.isEditing) return
  draggedIndex.value = index
  // Prevent scrolling when starting to drag
  // event.preventDefault() - can't do this on passive listener
}

async function handleTouchEnd(event) {
  if (draggedIndex.value === null) return
  
  const touch = event.changedTouches[0]
  const targetEl = document.elementFromPoint(touch.clientX, touch.clientY)
  const itemEl = targetEl?.closest('.image-wrapper')
  
  if (itemEl) {
    const allItems = Array.from(document.querySelectorAll('.inspiration-grid .image-wrapper'))
    const targetIndex = allItems.indexOf(itemEl)
    if (targetIndex !== -1 && targetIndex !== draggedIndex.value) {
      await handleDrop(targetIndex)
    }
  }
  
  draggedIndex.value = null
}


onMounted(loadData)
watch(() => contentStore.settings, loadData, { deep: true })
watch(() => contentStore.sectionTitles, loadData, { deep: true })

function cancelEdit() {
  if (originalData.value) {
    const data = JSON.parse(JSON.stringify(originalData.value))
    form.value = {
      title_en: data.title_en,
      title_de: data.title_de
    }
    inspirationImages.value = data.images
  }
}

async function saveAll() {
  emit('saving', true)
  try {
    await supabase.from('section_titles').update({
      title_en: form.value.title_en,
      title_de: form.value.title_de
    }).eq('section_key', 'inspiration')
    
    await contentStore.fetchAllData()
    emit('saved')
  } catch (e) { emit('error', e.message) } finally { emit('saving', false) }
}

defineExpose({ saveAll, cancelEdit })
</script>

<template>
  <div class="management-page">
    <section class="edit-section md-card">
      <h3>Überschrift</h3>
      <div v-if="!isEditing" class="form-grid">
        <div class="read-only-field">
          <div class="read-only-label">Titel (EN)</div>
          <div class="read-only-value">{{ form.title_en || '-' }}</div>
        </div>
        <div class="read-only-field">
          <div class="read-only-label">Titel (DE)</div>
          <div class="read-only-value">{{ form.title_de || '-' }}</div>
        </div>
      </div>
      <div v-else class="form-grid">
        <div class="md-text-field">
          <input type="text" v-model="form.title_en" id="title_en" />
          <label for="title_en">Titel (EN)</label>
        </div>
        <div class="md-text-field">
          <input type="text" v-model="form.title_de" id="title_de" />
          <label for="title_de">Titel (DE)</label>
        </div>
      </div>
    </section>

    <section class="edit-section md-card">
      <h3>Content</h3>
      <div v-if="!isEditing">
        <div class="homepage-preview-mint">
           <div class="insta-grid-preview">
              <div v-for="img in inspirationImages" :key="img.id" class="insta-item-preview">
                 <img :src="img.image_url" />
              </div>
           </div>
        </div>
      </div>
      <div v-else>
        <div class="inspiration-grid">
           <div 
             v-for="(img, idx) in inspirationImages" 
             :key="img.id" 
             class="image-wrapper"
             draggable="true"
             @dragstart="handleDragStart(idx)"
             @dragover="handleDragOver"
             @dragend="draggedIndex = null"
             @drop="handleDrop(idx)"
             @touchstart="handleTouchStart(idx, $event)"
             @touchend="handleTouchEnd($event)"
             :class="{ 'dragging': draggedIndex === idx }"
           >
             <div class="image-container-md">
               <img :src="img.image_url" />
               <div class="image-overlay-md">
                 <div class="reorder-controls">
                   <button @click="moveImage(idx, 'left')" class="md-fab-mini reorder-prev" :disabled="idx === 0"></button>
                   <button @click="moveImage(idx, 'right')" class="md-fab-mini reorder-next" :disabled="idx === inspirationImages.length - 1"></button>
                   <button @click="deleteImage(img.id)" class="md-fab-mini delete-btn">×</button>
                 </div>
               </div>
               <div class="drag-handle-hint">
                 <svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
               </div>
             </div>
           </div>
           
           <label class="upload-placeholder-md">
             <input type="file" multiple @change="handleImageUpload" accept="image/*" class="hidden-input" :disabled="uploading" />
             <div class="placeholder-content">
                <div class="upload-icon-circle">
                  <svg viewBox="0 0 24 24" class="plus-svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </div>
                <span class="placeholder-text">{{ uploading ? 'LÄDT...' : 'Hinzufügen' }}</span>
             </div>
           </label>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }

.inspiration-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
.image-container-md { position: relative; aspect-ratio: 3/4; border-radius: 0; overflow: hidden; border: 1px solid var(--md-outline-variant); cursor: default; }
.image-container-md img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s ease; }
.image-overlay-md { position: absolute; inset: 0; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.image-wrapper:hover .image-overlay-md { opacity: 1; }
.image-wrapper.dragging { opacity: 0.4; scale: 0.95; transition: none; }
.image-wrapper[draggable="true"] .image-container-md { cursor: grab; touch-action: none; }

.reorder-controls { display: flex; gap: 4px; background: rgba(255,255,255,0.95); padding: 4px; border-radius: 16px; }
.md-fab-mini { width: 28px; height: 28px; border-radius: 50%; background: white; border: none; color: var(--md-primary); cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.md-fab-mini:hover:not(:disabled) { background: var(--md-primary-container); }
.md-fab-mini:disabled { opacity: 0.3; cursor: not-allowed; }
.md-fab-mini.reorder-prev::after { content: "←"; }
.md-fab-mini.reorder-next::after { content: "→"; }
@media (max-width: 768px) {
  .md-fab-mini.reorder-prev::after { content: "▲"; }
  .md-fab-mini.reorder-next::after { content: "▼"; }
}
.delete-btn { color: #ba1a1a; margin-left: 2px; }

.drag-handle-hint { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.7); border-radius: 4px; padding: 2px 4px; opacity: 0.6; pointer-events: none; transition: opacity 0.15s; }
.image-wrapper:hover .drag-handle-hint { opacity: 0; }
.drag-handle-hint svg { width: 16px; height: 16px; fill: #666; }

@media (max-width: 768px) {
  .inspiration-grid { gap: 1rem !important; grid-template-columns: 1fr !important; }
  .image-wrapper .drag-handle-hint { opacity: 1; background: rgba(255,255,255,0.9); bottom: 40px; }
  .image-overlay-md { opacity: 1; background: transparent; pointer-events: none; }
  .reorder-controls { pointer-events: auto; transform: scale(1.3); }
}

.upload-placeholder-md {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  aspect-ratio: 3/4; border: 2px dashed var(--md-outline); border-radius: 0;
  cursor: pointer; background: var(--md-surface-container); transition: all 0.15s;
}
.upload-placeholder-md:hover { background: var(--md-surface); border-color: var(--md-primary); }
.placeholder-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.upload-icon-circle { width: 36px; height: 36px; border-radius: 18px; background: var(--md-surface); display: flex; align-items: center; justify-content: center; }
.plus-svg { width: 20px; height: 20px; fill: var(--md-primary); }
.placeholder-text { font-family: var(--md-font-sans); font-size: 0.625rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; color: var(--md-on-surface-variant); }

.hidden-input { display: none; }

.homepage-preview-mint { background-color: #deefef; padding: 4rem 2rem; border-radius: 0; }
.insta-grid-preview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; max-width: 800px; margin: 0 auto; }
.insta-item-preview { aspect-ratio: 3/4; overflow: hidden; }
.insta-item-preview img { width: 100%; height: 100%; object-fit: cover; }


@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  .inspiration-grid { grid-template-columns: 1fr; }
  .insta-grid-preview { grid-template-columns: 1fr; gap: 2rem; }
}
</style>
