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
const draggedStoreIndex = ref(null)
const draggedImageInfo = ref(null)
const originalData = ref({})

const formatText = (text) => {
    if (!text) return [];
    return text.split('\n').filter(line => line.trim() !== '');
};

function loadData() {
  const section = contentStore.sectionTitles.find(s => s.section_key === 'stores')
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
    }).eq('section_key', 'stores')
    
    for (const store of contentStore.storesData) {
      await supabase.from('stores').update({
        name: store.name,
        address: store.address,
        zip_code: store.zip_code,
        city: store.city,
        phone_number: store.phone_number,
        business_hours: store.business_hours
      }).eq('id', store.id)
    }
    await contentStore.fetchAllData()
    emit('saved')
  } catch (e) { emit('error', e.message) } finally { emit('saving', false) }
}

async function handleImageUpload(event, storeId) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}_${randomStr}_store_${storeId}.jpg`
    const { error: uploadError } = await supabase.storage.from('meandme_assets').upload(`stores/${fileName}`, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from('meandme_assets').getPublicUrl(`stores/${fileName}`)
    
    const store = contentStore.storesData.find(s => s.id === storeId)
    const order = (store?.images?.length || 0) + 1
    
    await supabase.from('store_images').insert([{ 
      store_id: storeId, 
      image_url: publicUrl,
      display_order: order
    }])
    await contentStore.fetchAllData()
  } catch (e) { alert(e.message) } finally {
    event.target.value = ''
  }
}

async function moveStore(index, direction) {
  const stores = [...contentStore.storesData]
  let targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= stores.length) return

  emit('saving', true)
  try {
    const itemA = stores[index]
    const itemB = stores[targetIndex]
    const tempOrder = itemA.display_order
    itemA.display_order = itemB.display_order
    itemB.display_order = tempOrder
    
    await Promise.all([
      supabase.from('stores').update({ display_order: itemA.display_order }).eq('id', itemA.id),
      supabase.from('stores').update({ display_order: itemB.display_order }).eq('id', itemB.id)
    ])
    await contentStore.fetchAllData()
  } catch (e) { emit('error', e.message) } finally { emit('saving', false) }
}

async function moveStoreImage(storeId, index, direction) {
  const store = contentStore.storesData.find(s => s.id === storeId)
  if (!store) return
  const images = [...store.images]
  let targetIndex = direction === 'left' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= images.length) return

  emit('saving', true)
  try {
    const itemA = images[index]
    const itemB = images[targetIndex]
    const tempOrder = itemA.display_order
    itemA.display_order = itemB.display_order
    itemB.display_order = tempOrder

    await Promise.all([
      supabase.from('store_images').update({ display_order: itemA.display_order }).eq('id', itemA.id),
      supabase.from('store_images').update({ display_order: itemB.display_order }).eq('id', itemB.id)
    ])
    await contentStore.fetchAllData()
  } catch (e) { emit('error', e.message) } finally { emit('saving', false) }
}

function handleStoreDragStart(index) {
  if (!props.isEditing) return
  draggedStoreIndex.value = index
}

async function handleStoreDrop(targetIndex) {
  if (!props.isEditing || draggedStoreIndex.value === null || draggedStoreIndex.value === targetIndex) {
    draggedStoreIndex.value = null
    return
  }
  const stores = [...contentStore.storesData]
  const movedItem = stores.splice(draggedStoreIndex.value, 1)[0]
  stores.splice(targetIndex, 0, movedItem)
  draggedStoreIndex.value = null
  emit('saving', true)
  try {
    const updates = stores.map((item, idx) => ({ id: item.id, display_order: idx + 1 }))
    await Promise.all(updates.map(u => supabase.from('stores').update({ display_order: u.display_order }).eq('id', u.id)))
    await contentStore.fetchAllData()
  } catch (e) { emit('error', e.message) } finally { emit('saving', false) }
}

function handleImageDragStart(storeId, index) {
  if (!props.isEditing) return
  draggedImageInfo.value = { storeId, index }
}

async function handleImageDrop(storeId, targetIndex) {
  if (!props.isEditing || !draggedImageInfo.value || draggedImageInfo.value.storeId !== storeId || draggedImageInfo.value.index === targetIndex) {
    draggedImageInfo.value = null
    return
  }
  const store = contentStore.storesData.find(s => s.id === storeId)
  const images = [...store.images]
  const movedItem = images.splice(draggedImageInfo.value.index, 1)[0]
  images.splice(targetIndex, 0, movedItem)
  draggedImageInfo.value = null
  emit('saving', true)
  try {
    const updates = images.map((item, idx) => ({ id: item.id, display_order: idx + 1 }))
    await Promise.all(updates.map(u => supabase.from('store_images').update({ display_order: u.display_order }).eq('id', u.id)))
    await contentStore.fetchAllData()
  } catch (e) { emit('error', e.message) } finally { emit('saving', false) }
}

function handleDragOver(event) {
  if (!props.isEditing) return
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

async function deleteImage(id) {
  if (!confirm("Bild löschen?")) return
  try {
    await supabase.from('store_images').delete().eq('id', id)
    await contentStore.fetchAllData()
  } catch (e) { alert(e.message) }
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
      <div class="stores-stack">
        <div 
          v-for="(store, storeIdx) in contentStore.storesData" 
          :key="store.id" 
          class="store-item-md"
          :draggable="isEditing"
          @dragstart="handleStoreDragStart(storeIdx)"
          @dragover="handleDragOver"
          @drop="handleStoreDrop(storeIdx)"
          :class="{ 'dragging': draggedStoreIndex === storeIdx }"
        >
          <div v-if="isEditing" class="store-reorder-handle">
            <div class="reorder-btns-vertical">
              <button @click="moveStore(storeIdx, 'up')" class="reorder-btn" :disabled="storeIdx === 0">▲</button>
              <button @click="moveStore(storeIdx, 'down')" class="reorder-btn" :disabled="storeIdx === contentStore.storesData.length - 1">▼</button>
            </div>
          </div>

          <div v-if="!isEditing" class="store-view-md">
            <div class="store-homepage-preview">
                <h3 class="preview-store-name">{{ store.name }}</h3>
                <p class="preview-address">{{ store.address }}</p>
                <p class="preview-address">{{ store.zip_code }} {{ store.city }}</p>
                
                <div class="preview-contact">
                    <p class="preview-phone">{{ store.phone_number }}</p>
                </div>
                
                <h4 class="preview-opening-title mb-2">Öffnungszeiten</h4>
                <div class="preview-opening-hours">
                    <p v-for="(line, idx) in formatText(store.business_hours)" :key="idx">
                        {{ line }}
                    </p>
                </div>
            </div>
          </div>
          <div v-else class="store-edit-md">
            <div class="md-text-field"><input type="text" v-model="store.name" /><label>Name</label></div>
            <div class="md-text-field"><input type="text" v-model="store.address" /><label>Adresse</label></div>
            <div class="grid-2">
              <div class="md-text-field"><input type="text" v-model="store.zip_code" /><label>PLZ</label></div>
              <div class="md-text-field"><input type="text" v-model="store.city" /><label>Stadt</label></div>
            </div>
            <div class="md-text-field"><input type="text" v-model="store.phone_number" /><label>Telefon</label></div>
            <div class="md-text-field"><textarea v-model="store.business_hours" rows="4"></textarea><label>Öffnungszeiten</label></div>
            
            <div class="store-preview-section">
                <div class="gallery-label">Homepage Vorschau</div>
                <div class="store-homepage-preview">
                    <h3 class="preview-store-name">{{ store.name }}</h3>
                    <p class="preview-address">{{ store.address }}</p>
                    <p class="preview-address">{{ store.zip_code }} {{ store.city }}</p>
                    
                    <div class="preview-contact">
                        <p class="preview-phone">{{ store.phone_number }}</p>
                    </div>
                    
                    <h4 class="preview-opening-title mb-2">Öffnungszeiten</h4>
                    <div class="preview-opening-hours">
                        <p v-for="(line, idx) in formatText(store.business_hours)" :key="idx">
                            {{ line }}
                        </p>
                    </div>
                </div>
            </div>
          </div>
          
          <div class="store-gallery-md">
             <div class="gallery-label">Bilder</div>
             <div class="gallery-grid">
               <div 
                 v-for="(img, imgIdx) in store.images" 
                 :key="img.id" 
                 class="gallery-item"
                 :draggable="isEditing"
                 @dragstart.stop="handleImageDragStart(store.id, imgIdx)"
                 @dragover.stop="handleDragOver"
                 @drop.stop="handleImageDrop(store.id, imgIdx)"
                 :class="{ 'dragging': draggedImageInfo?.storeId === store.id && draggedImageInfo?.index === imgIdx }"
               >
                 <img :src="img.image_url" />
                 <div v-if="isEditing" class="img-reorder-overlay">
                   <div class="img-controls">
                     <button @click.stop="moveStoreImage(store.id, imgIdx, 'left')" class="mini-reorder-btn" :disabled="imgIdx === 0">←</button>
                     <button @click.stop="moveStoreImage(store.id, imgIdx, 'right')" class="mini-reorder-btn" :disabled="imgIdx === store.images.length - 1">→</button>
                     <button @click.stop="deleteImage(img.id)" class="mini-del-btn">✕</button>
                   </div>
                 </div>
               </div>
               <label v-if="isEditing" class="add-btn-md">
                 <input type="file" @change="e => handleImageUpload(e, store.id)" accept="image/*" class="hidden" />
                 <div class="add-btn-content">
                   <svg viewBox="0 0 24 24" class="add-plus-svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                   <span>Hinzufügen</span>
                 </div>
               </label>
             </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.store-item-md { padding: 1.5rem 0; border-bottom: 1px solid var(--md-outline-variant); display: flex; gap: 2rem; align-items: start; transition: all 0.15s; }
.store-item-md.dragging { opacity: 0.4; background: var(--md-surface-container); }
.store-item-md[draggable="true"] { cursor: grab; }
.store-item-md[draggable="true"]:active { cursor: grabbing; }

.store-reorder-handle { display: flex; align-items: center; padding-top: 0.75rem; }
.reorder-btns-vertical { display: flex; flex-direction: column; gap: 2px; }
.reorder-btn { background: var(--md-surface); border: 1px solid var(--md-outline); border-radius: 4px; width: 28px; height: 28px; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--md-on-surface-variant); transition: all 0.15s; }
.reorder-btn:hover:not(:disabled) { background: var(--md-primary-container); color: var(--md-on-primary-container); border-color: transparent; }
.reorder-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.store-view-md, .store-edit-md { flex: 1; }
.store-gallery-md { width: 350px; flex-shrink: 0; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.hours-view-md { margin-top: 1rem; white-space: pre-line; font-family: var(--md-font-sans); font-size: 0.8125rem; color: var(--md-on-surface-variant); line-height: 1.6; }
.gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 0.5rem; margin-top: 0.5rem; }
.gallery-item { position: relative; aspect-ratio: 1/1; border-radius: 0; overflow: hidden; border: 1px solid var(--md-outline-variant); cursor: default; }
.gallery-item.dragging { opacity: 0.4; scale: 0.9; }
.gallery-item[draggable="true"] { cursor: grab; }
.gallery-item[draggable="true"]:active { cursor: grabbing; }

.gallery-item img { width: 100%; height: 100%; object-fit: cover; }

.img-reorder-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
.gallery-item:hover .img-reorder-overlay { opacity: 1; }
.img-controls { display: flex; gap: 2px; background: rgba(255,255,255,0.95); padding: 4px; border-radius: 16px; }
.mini-reorder-btn, .mini-del-btn { width: 22px; height: 22px; border-radius: 50%; border: none; background: white; font-size: 0.6rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.mini-reorder-btn:hover:not(:disabled) { background: var(--md-primary-container); color: var(--md-on-primary-container); }
.mini-reorder-btn:disabled { opacity: 0.3; }
.mini-del-btn { color: var(--md-error); }
.mini-del-btn:hover { background: #fce8e6; }
.add-btn-md {
  aspect-ratio: 1/1;
  border: 2px dashed var(--md-outline);
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--md-surface-container);
  transition: border-color 0.15s, background 0.15s;
}
.add-btn-md:hover { background: var(--md-surface); border-color: var(--md-primary); }

.add-btn-content { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.add-plus-svg { width: 18px; height: 18px; fill: var(--md-primary); }
.add-btn-content span { font-family: var(--md-font-sans); font-size: 0.5625rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; color: var(--md-on-surface-variant); }
.gallery-label { font-family: var(--md-font-sans); font-size: 0.6875rem; text-transform: uppercase; font-weight: 500; color: var(--md-on-surface-variant); margin-bottom: 0.5rem; }

/* Homepage Preview Styling */
.store-preview-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px dashed var(--md-outline);
}

.store-homepage-preview {
    background-color: #deefef;
    padding: 3rem;
    color: #575756;
    font-family: 'Raleway', sans-serif;
    text-align: left;
    border-radius: 0;
    max-width: 480px;
}

.preview-store-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 1rem;
    color: #575756;
    font-weight: 500;
    line-height: 1.2;
}

.preview-address {
    font-size: 1.05rem;
    margin: 0;
    line-height: 1.4;
    color: #575756;
}

.preview-phone {
    font-weight: 600;
    font-size: 1.05rem;
    margin: 0;
    line-height: 1.4;
    color: #575756;
}

.preview-opening-title {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 0.5rem;
    font-family: 'Playfair Display', serif;
    color: #575756;
    line-height: 1.2;
}

.preview-opening-hours p {
    font-size: 1rem;
    margin: 0;
    line-height: 1.6;
    color: #575756;
}

.mb-2 { margin-bottom: 0.5rem; }

.hidden { display: none; }
@media (max-width: 768px) {
  .form-grid { 
    grid-template-columns: 1fr !important; 
    gap: 0 !important; 
  }
  
  .store-item-md { 
    flex-direction: column !important; 
    gap: 1.5rem !important;
    padding: 1.5rem 0 !important;
    align-items: stretch !important;
  }
  
  .store-edit-md {
    width: 100% !important;
    display: block !important;
  }
  
  .store-gallery-md {
    width: 100% !important;
    margin-top: 1rem;
  }
  
  .store-homepage-preview { 
    max-width: 100% !important; 
    padding: 1.5rem !important; 
  }
  
  .grid-2 {
    display: block !important;
    width: 100% !important;
  }
}
</style>
