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
const showAddForm = ref(false)
const form = ref({ title_en: '', title_de: '' })
const localBrands = ref([])
const deletedBrandIds = ref([])
const newBrand = ref({ name: '', homepage_url: '', logoFile: null, logoPreview: null })
const originalData = ref({ section: {}, brands: [] })

function loadData() {
  const section = contentStore.sectionTitles.find(s => s.section_key === 'brands')
  form.value = {
    title_en: section?.title_en || '',
    title_de: section?.title_de || ''
  }
  localBrands.value = JSON.parse(JSON.stringify(contentStore.brands))
  deletedBrandIds.value = []
  originalData.value = {
    section: JSON.parse(JSON.stringify(form.value)),
    brands: JSON.parse(JSON.stringify(localBrands.value))
  }
}

onMounted(loadData)
watch(() => contentStore.sectionTitles, loadData, { deep: true })
watch(() => contentStore.brands, (newVal) => {
  // Only update local copy if we are not currently editing
  if (!props.isEditing) {
    localBrands.value = JSON.parse(JSON.stringify(newVal))
  }
}, { deep: true })

function cancelEdit() {
  form.value = JSON.parse(JSON.stringify(originalData.value.section))
  localBrands.value = JSON.parse(JSON.stringify(originalData.value.brands))
  deletedBrandIds.value = []
  resetAddForm()
}

function resetAddForm() {
  showAddForm.value = false
  newBrand.value = { name: '', homepage_url: '', logoFile: null, logoPreview: null }
}

async function processLogo(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) { height *= maxDim / width; width = maxDim; }
        } else {
          if (height > maxDim) { width *= maxDim / height; height = maxDim; }
        }
        canvas.width = width; canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      };
    };
  });
}

function handleLogoUpdate(event, brand) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    brand.logoPreview = e.target.result
    brand.logoFile = file
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function deleteBrand(idx) {
  const brand = localBrands.value[idx]
  if (brand.id) deletedBrandIds.value.push(brand.id)
  localBrands.value.splice(idx, 1)
}

function moveBrand(index, direction) {
  let targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= localBrands.value.length) return
  const item = localBrands.value.splice(index, 1)[0]
  localBrands.value.splice(targetIndex, 0, item)
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

function handleDrop(targetIndex) {
  if (!props.isEditing || draggedIndex.value === null || draggedIndex.value === targetIndex) {
    draggedIndex.value = null
    return
  }
  const movedItem = localBrands.value.splice(draggedIndex.value, 1)[0]
  localBrands.value.splice(targetIndex, 0, movedItem)
  draggedIndex.value = null
}

function sortByAlphabet() {
  localBrands.value.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

function prepareNewLogo(event) {
  const file = event.target.files[0]
  if (!file) return
  newBrand.value.logoFile = file
  const reader = new FileReader()
  reader.onload = (e) => newBrand.value.logoPreview = e.target.result
  reader.readAsDataURL(file)
  event.target.value = ''
}

function addBrandLocally() {
  if (!newBrand.value.logoFile || !newBrand.value.name) {
    alert("Name und Logo sind erforderlich.")
    return
  }
  localBrands.value.push({
    name: newBrand.value.name,
    homepage_url: newBrand.value.homepage_url,
    logoFile: newBrand.value.logoFile,
    logoPreview: newBrand.value.logoPreview,
    isNew: true
  })
  resetAddForm()
}

async function saveAll() {
  emit('saving', true)
  try {
    // 1. Update Section Titles
    await supabase.from('section_titles').update({
      title_en: form.value.title_en,
      title_de: form.value.title_de
    }).eq('section_key', 'brands')

    // 2. Handle Deletions
    if (deletedBrandIds.value.length > 0) {
      await supabase.from('brands').delete().in('id', deletedBrandIds.value)
    }

    // 3. Process each brand
    for (let i = 0; i < localBrands.value.length; i++) {
      const brand = localBrands.value[i]
      let logoUrl = brand.logo_url

      // Upload new logo if exists
      if (brand.logoFile) {
        const blob = await processLogo(brand.logoFile)
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(2, 8)
        const fileName = `${timestamp}_${randomStr}_brand_${i}.png`
        
        const { error: uploadError } = await supabase.storage.from('meandme_assets').upload(`brands/${fileName}`, blob)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('meandme_assets').getPublicUrl(`brands/${fileName}`)
        logoUrl = publicUrl
      }

      const brandData = {
        name: brand.name,
        homepage_url: brand.homepage_url,
        logo_url: logoUrl,
        display_order: i + 1
      }

      if (brand.isNew) {
        await supabase.from('brands').insert([brandData])
      } else {
        await supabase.from('brands').update(brandData).eq('id', brand.id)
      }
    }

    await contentStore.fetchAllData()
    emit('saved')
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
  const itemEl = targetEl?.closest('.brand-item-md')
  if (itemEl) {
    const allItems = Array.from(document.querySelectorAll('.brands-list-md .brand-item-md'))
    const targetIndex = allItems.indexOf(itemEl)
    if (targetIndex !== -1 && targetIndex !== draggedIndex.value) {
      handleDrop(targetIndex)
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
      <div class="section-header-toolbar">
        <h3>Content</h3>
        <button v-if="isEditing && localBrands.length > 1" @click="sortByAlphabet" class="toolbar-btn" title="Alphabetisch sortieren">
          <svg viewBox="0 0 24 24" class="btn-icon"><path d="M14.94 4.66h-4.72l2.36-2.36 2.36 2.36zm-4.72 14.68h4.72l-2.36 2.36-2.36-2.36zM7.5 15h2l-3 3.5L3.5 15h2V6h-2L6.5 2.5 9.5 6h-2v9zM13 7h7v2h-7V7zm0 4h7v2h-7v-2zm0 4h7v2h-7v-2z"/></svg>
          <span>A-Z Sort</span>
        </button>
      </div>
      <div class="brands-list-md">
        <div 
          v-for="(brand, idx) in localBrands" 
          :key="brand.id || 'new-' + idx" 
          class="brand-item-md"
          :draggable="isEditing"
          @dragstart="handleDragStart(idx)"
          @dragover="handleDragOver"
          @dragend="draggedIndex = null"
          @drop="handleDrop(idx)"
          @touchstart="handleTouchStart(idx)"
          @touchend="handleTouchEnd($event)"
          :class="{ 'dragging': draggedIndex === idx }"
        >
          <div v-if="isEditing" class="brand-reorder-btns">
            <button @click="moveBrand(idx, 'up')" class="reorder-btn" :disabled="idx === 0">▲</button>
            <button @click="moveBrand(idx, 'down')" class="reorder-btn" :disabled="idx === localBrands.length - 1">▼</button>
          </div>

          <div class="brand-logo-md" :class="{ 'clickable': isEditing }">
            <img :src="brand.logoPreview || brand.logo_url" />
            <label v-if="isEditing" class="logo-edit-overlay">
              <input type="file" @change="e => handleLogoUpdate(e, brand)" accept="image/*" class="hidden" />
              <svg viewBox="0 0 24 24" class="edit-icon-svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </label>
          </div>
          
          <div v-if="!isEditing" class="brand-info-md">
            <span class="brand-name">{{ brand.name }}</span>
            <span class="brand-url">{{ brand.homepage_url || '-' }}</span>
          </div>
          <div v-else class="brand-edit-md">
            <div class="md-text-field mini">
              <input type="text" v-model="brand.name" placeholder="Name..." />
              <label>Name</label>
            </div>
            <div class="md-text-field mini">
              <input type="url" v-model="brand.homepage_url" placeholder="Website..." />
              <label>Website</label>
            </div>
            <button @click="deleteBrand(idx)" class="btn-icon-del">✕</button>
          </div>
        </div>
        
        <div v-if="isEditing" class="add-section-wrapper">
          <div v-if="!showAddForm" class="add-btn-container">
            <button @click="showAddForm = true" class="add-new-btn">
              <svg viewBox="0 0 24 24" class="btn-icon"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              <span>Marke hinzufügen</span>
            </button>
          </div>
          
          <div v-else class="add-brand-form md-card-elevated">
            <div class="form-header">
              <h4>MARKE HINZUFÜGEN</h4>
              <button @click="resetAddForm" class="btn-close-md">
                <svg viewBox="0 0 24 24" class="close-icon"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            
            <div class="add-form-content">
              <div class="logo-upload-box">
                <label class="logo-placeholder-premium" :class="{ 'has-image': newBrand.logoPreview }">
                  <input type="file" @change="prepareNewLogo" accept="image/*" class="hidden" />
                  <img v-if="newBrand.logoPreview" :src="newBrand.logoPreview" />
                  <div v-else class="placeholder-content">
                    <div class="icon-circle">
                      <svg viewBox="0 0 24 24" class="upload-svg"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    </div>
                    <span>LOGO*</span>
                  </div>
                </label>
              </div>
              
              <div class="fields-box">
                <div class="md-text-field">
                  <input type="text" v-model="newBrand.name" id="new_brand_name" required />
                  <label for="new_brand_name">Name der Marke*</label>
                </div>
                <div class="md-text-field">
                  <input type="url" v-model="newBrand.homepage_url" id="new_brand_url" placeholder="https://..." />
                  <label for="new_brand_url">Website URL</label>
                </div>
              </div>
            </div>
            
            <div class="form-actions-md">
              <button @click="resetAddForm" class="md-button md-button-text">Abbrechen</button>
              <button @click="addBrandLocally" class="md-button md-button-filled" :disabled="!newBrand.name || !newBrand.logoFile">
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }

.section-header-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.section-header-toolbar h3 { margin: 0; }

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 18px;
  border: 1px solid var(--md-outline);
  background: var(--md-surface);
  color: var(--md-primary);
  font-family: var(--md-font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}
.toolbar-btn:hover { background: rgba(26, 115, 232, 0.04); }
.toolbar-btn .btn-icon { width: 16px; height: 16px; fill: currentColor; }

.brand-item-md { display: flex; align-items: center; gap: 1.25rem; padding: 12px 0; border-bottom: 1px solid var(--md-outline-variant); transition: all 0.15s; position: relative; }
.brand-item-md.dragging { opacity: 0.4; background: var(--md-surface-container); transition: none; }
.brand-item-md[draggable="true"] { cursor: grab; touch-action: none; }
.brand-item-md[draggable="true"]:active { cursor: grabbing; }

.brand-reorder-btns { display: flex; flex-direction: column; gap: 2px; }
.reorder-btn { background: var(--md-surface); border: 1px solid var(--md-outline); border-radius: 4px; width: 24px; height: 24px; font-size: 0.65rem; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--md-on-surface-variant); transition: all 0.15s; }
.reorder-btn:hover:not(:disabled) { background: var(--md-primary-container); color: var(--md-on-primary-container); border-color: transparent; }
.reorder-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.brand-logo-md {
  width: 48px;
  height: 48px;
  background: var(--md-surface);
  border-radius: 8px;
  border: 1px solid var(--md-outline-variant);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}
.brand-logo-md img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }

.logo-edit-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; cursor: pointer; transition: opacity 0.15s;
}
.brand-logo-md:hover .logo-edit-overlay { opacity: 1; }

.edit-icon-svg { width: 20px; height: 20px; fill: white; }
.brand-info-md { display: flex; flex-direction: column; gap: 2px; }
.brand-name { font-family: var(--md-font-sans); font-weight: 500; font-size: 0.875rem; color: var(--md-on-surface); }
.brand-url { font-family: var(--md-font-sans); font-size: 0.75rem; color: var(--md-on-surface-variant); }
.brand-edit-md { display: flex; flex: 1; gap: 0.75rem; align-items: center; }
.md-text-field.mini { margin: 0; flex: 1; }
.btn-icon-del { background: none; border: none; color: var(--md-error); cursor: pointer; padding: 8px; font-weight: bold; font-size: 1.1rem; border-radius: 50%; transition: background 0.15s; }
.btn-icon-del:hover { background: #fce8e6; }

.add-section-wrapper { margin-top: 2rem; }
.add-btn-container { display: flex; justify-content: center; }

.add-new-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 0 24px; height: 40px; border-radius: 20px;
  background: var(--md-primary-container); color: var(--md-on-primary-container);
  border: none; cursor: pointer;
  font-family: var(--md-font-sans); font-weight: 500; font-size: 0.875rem;
  transition: filter 0.15s, box-shadow 0.15s;
}
.add-new-btn:hover { filter: brightness(0.97); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.add-new-btn .btn-icon { width: 20px; height: 20px; fill: currentColor; }

.add-brand-form {
  padding: 24px;
  background: var(--md-surface);
  border-radius: 12px;
  border: 1px solid var(--md-outline-variant);
  box-shadow: 0 1px 2px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.06);
  animation: slideDown 0.2s ease-out;
}

.form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.form-header h4 { margin: 0; font-family: var(--md-font-sans); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--md-on-surface-variant); }

.btn-close-md {
  background: none; border: none; cursor: pointer;
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; transition: background 0.15s;
}
.btn-close-md:hover { background: var(--md-surface-container); }
.close-icon { width: 18px; height: 18px; fill: var(--md-on-surface-variant); }

.add-form-content { display: flex; gap: 2rem; }
.logo-upload-box { flex-shrink: 0; }
.fields-box { flex-grow: 1; display: flex; flex-direction: column; gap: 0.75rem; justify-content: center; }

.logo-placeholder-premium {
  width: 100px; height: 100px;
  border: 2px dashed var(--md-outline);
  border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; overflow: hidden;
  background: var(--md-surface-container);
  transition: border-color 0.15s, background 0.15s;
}
.logo-placeholder-premium:hover { border-color: var(--md-primary); background: var(--md-surface); }
.logo-placeholder-premium.has-image { border-style: solid; border-color: var(--md-outline-variant); background: white; }
.logo-placeholder-premium img { width: 100%; height: 100%; object-fit: contain; padding: 8px; }

.placeholder-content { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--md-on-surface-variant); }
.icon-circle { width: 32px; height: 32px; background: var(--md-surface); border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.upload-svg { width: 16px; height: 16px; fill: var(--md-primary); }
.placeholder-content span { font-family: var(--md-font-sans); font-size: 0.625rem; font-weight: 600; letter-spacing: 0.04em; }

.form-actions-md {
  display: flex; justify-content: flex-end; gap: 8px;
  margin-top: 1.5rem; padding-top: 1rem;
  border-top: 1px solid var(--md-outline-variant);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

.hidden { display: none; }
@media (max-width: 768px) {
  .form-grid { 
    grid-template-columns: 1fr !important; 
    gap: 0 !important; 
  }
  .add-form-content { flex-direction: column; align-items: center; }
  .fields-box { width: 100%; }
  
  .brand-item-md {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 1rem 0;
    text-align: center;
  }
  
  .brand-reorder-btns {
    flex-direction: row;
    justify-content: center;
    gap: 8px;
  }
  
  .brand-logo-md {
    margin: 0 auto;
    width: 70px;
    height: 70px;
  }
  
  .brand-edit-md {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .md-text-field.mini {
    width: 100%;
  }

  .btn-icon-del {
    position: absolute;
    top: -4px;
    right: -4px;
  }
}
</style>
