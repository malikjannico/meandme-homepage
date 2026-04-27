<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../../lib/supabase'
import { useContentStore } from '../../../stores/content'

const props = defineProps({ isEditing: Boolean })
const emit = defineEmits(['saved', 'error', 'saving'])

const { t } = useI18n()
const contentStore = useContentStore()

const uploading = ref(false)
const draggedIndex = ref(null)
const form = ref({ title_en: '', title_de: '' })
const originalData = ref({})

function loadData() {
  const section = contentStore.sectionTitles.find(s => s.section_key === 'collection')
  form.value = {
    title_en: section?.title_en || '',
    title_de: section?.title_de || ''
  }
  originalData.value = JSON.parse(JSON.stringify(form.value))
}

onMounted(loadData)
watch(() => contentStore.sectionTitles, loadData, { deep: true })

function cancelEdit() {
  form.value = JSON.parse(JSON.stringify(originalData.value))
}

async function saveAll() {
  emit('saving', true)
  try {
    await supabase.from('section_titles').update({
      title_en: form.value.title_en,
      title_de: form.value.title_de
    }).eq('section_key', 'collection')
    await contentStore.fetchAllData()
    emit('saved')
  } catch (e) { emit('error', e.message) } finally { emit('saving', false) }
}

async function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const targetRatio = 3 / 4;
        const imgRatio = img.width / img.height;
        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;
        if (imgRatio > targetRatio) {
          sourceWidth = img.height * targetRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          sourceHeight = img.width / targetRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }
        canvas.width = 900; canvas.height = 1200;
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    const croppedBlob = await processImage(file);
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}_${randomStr}_collection.jpg`
    const { error: uploadError } = await supabase.storage.from('meandme_assets').upload(`collection/${fileName}`, croppedBlob);
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('meandme_assets').getPublicUrl(`collection/${fileName}`)
    await supabase.from('collection_images').insert([{ image_url: publicUrl, display_order: contentStore.collections.length + 1 }])
    await contentStore.fetchAllData()
  } catch (e) { alert(e.message) } finally { 
    uploading.value = false 
    event.target.value = ''
  }
}

async function deleteImage(id) {
  if (!confirm("Bild löschen?")) return
  try {
    await supabase.from('collection_images').delete().eq('id', id)
    await contentStore.fetchAllData()
  } catch (e) { alert(e.message) }
}

async function moveImage(index, direction) {
  const collections = [...contentStore.collections]
  let targetIndex = direction === 'left' ? index - 1 : index + 1
  
  if (targetIndex < 0 || targetIndex >= collections.length) return
  
  emit('saving', true)
  try {
    const itemA = collections[index]
    const itemB = collections[targetIndex]
    
    const tempOrder = itemA.display_order
    itemA.display_order = itemB.display_order
    itemB.display_order = tempOrder
    
    await Promise.all([
      supabase.from('collection_images').update({ display_order: itemA.display_order }).eq('id', itemA.id),
      supabase.from('collection_images').update({ display_order: itemB.display_order }).eq('id', itemB.id)
    ])
    
    await contentStore.fetchAllData()
  } catch (e) {
    emit('error', e.message)
  } finally {
    emit('saving', false)
  }
}

function handleDragStart(index) {
  if (!props.isEditing) return
  draggedIndex.value = index
}

function handleDragOver(event) {
  if (!props.isEditing) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

async function handleDrop(targetIndex) {
  if (!props.isEditing || draggedIndex.value === null || draggedIndex.value === targetIndex) {
    draggedIndex.value = null
    return
  }
  
  const collections = [...contentStore.collections]
  const movedItem = collections.splice(draggedIndex.value, 1)[0]
  collections.splice(targetIndex, 0, movedItem)
  
  draggedIndex.value = null
  emit('saving', true)
  
  try {
    // Re-assign all display orders to match current array sequence
    const updates = collections.map((item, idx) => ({
      id: item.id,
      display_order: idx + 1
    }))
    
    await Promise.all(updates.map(u => 
      supabase.from('collection_images').update({ display_order: u.display_order }).eq('id', u.id)
    ))
    
    await contentStore.fetchAllData()
  } catch (e) {
    emit('error', e.message)
  } finally {
    emit('saving', false)
  }
}

defineExpose({ saveAll, cancelEdit })

function handleTouchStart(index) {
  if (!props.isEditing) return
  draggedIndex.value = index
}

async function handleTouchEnd(event) {
  if (draggedIndex.value === null) return
  
  const touch = event.changedTouches[0]
  const targetEl = document.elementFromPoint(touch.clientX, touch.clientY)
  const itemEl = targetEl?.closest('.image-wrapper')
  
  if (itemEl) {
    const allItems = Array.from(document.querySelectorAll('.collection-grid .image-wrapper'))
    const targetIndex = allItems.indexOf(itemEl)
    if (targetIndex !== -1 && targetIndex !== draggedIndex.value) {
      await handleDrop(targetIndex)
    }
  }
  
  draggedIndex.value = null
}
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
      <div class="collection-grid">
        <div 
          v-for="(img, idx) in contentStore.collections" 
          :key="img.id" 
          class="image-wrapper"
          :draggable="isEditing"
          @dragstart="handleDragStart(idx)"
          @dragover="handleDragOver"
          @dragend="draggedIndex = null"
          @drop="handleDrop(idx)"
          @touchstart="handleTouchStart(idx)"
          @touchend="handleTouchEnd($event)"
          :class="{ 'dragging': draggedIndex === idx }"
        >
          <div class="image-container-md">
            <img :src="img.image_url" alt="Collection" />
            <div v-if="isEditing" class="image-overlay-md">
               <div class="reorder-controls">
                 <button @click.stop="moveImage(idx, 'left')" class="md-fab-mini mini-btn" :disabled="idx === 0">←</button>
                 <button @click.stop="moveImage(idx, 'right')" class="md-fab-mini mini-btn" :disabled="idx === contentStore.collections.length - 1">→</button>
                 <button @click.stop="deleteImage(img.id)" class="md-fab-mini delete-btn">✕</button>
               </div>
            </div>
            <div v-if="isEditing" class="drag-handle-hint">
              <svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </div>
          </div>
        </div>
        
        <div v-if="isEditing" class="image-wrapper">
          <label class="upload-placeholder-md">
            <input type="file" @change="handleFileUpload" accept="image/*" class="hidden-input" :disabled="uploading" />
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
.collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
.image-container-md { position: relative; aspect-ratio: 3/4; border-radius: 0; overflow: hidden; border: 1px solid var(--md-outline-variant); cursor: default; }
.image-container-md img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s ease; }
.image-overlay-md { position: absolute; inset: 0; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.image-wrapper:hover .image-overlay-md { opacity: 1; }
.image-wrapper.dragging { opacity: 0.4; scale: 0.95; transition: none; }
.image-wrapper[draggable="true"] .image-container-md { cursor: grab; touch-action: none; }
.image-wrapper[draggable="true"] .image-container-md:active { cursor: grabbing; }

.reorder-controls { display: flex; gap: 4px; background: rgba(255,255,255,0.95); padding: 4px; border-radius: 16px; }
.md-fab-mini { width: 28px; height: 28px; border-radius: 50%; background: white; border: none; color: var(--md-primary); cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.md-fab-mini:hover:not(:disabled) { background: var(--md-primary-container); }
.md-fab-mini:disabled { opacity: 0.3; cursor: not-allowed; }
.delete-btn { color: var(--md-error); margin-left: 2px; }
.delete-btn:hover { background: #fce8e6; }

.drag-handle-hint { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.7); border-radius: 4px; padding: 2px 4px; opacity: 0.6; pointer-events: none; transition: opacity 0.15s; }
.image-wrapper:hover .drag-handle-hint { opacity: 0; }
.drag-handle-hint svg { width: 16px; height: 16px; fill: #666; }

.upload-placeholder-md {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  aspect-ratio: 3/4;
  border: 2px dashed var(--md-outline);
  border-radius: 0;
  cursor: pointer;
  background: var(--md-surface-container);
  transition: border-color 0.15s, background 0.15s;
}
.upload-placeholder-md:hover { background: var(--md-surface); border-color: var(--md-primary); }

.placeholder-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.upload-icon-circle { width: 36px; height: 36px; border-radius: 18px; background: var(--md-surface); display: flex; align-items: center; justify-content: center; }
.plus-svg { width: 20px; height: 20px; fill: var(--md-primary); }
.placeholder-text { font-family: var(--md-font-sans); font-size: 0.625rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; color: var(--md-on-surface-variant); }

.hidden-input { display: none; }
@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; gap: 0; }
  .collection-grid { gap: 0.5rem !important; }
}
</style>
