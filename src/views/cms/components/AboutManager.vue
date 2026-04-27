<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../../lib/supabase'
import { useContentStore } from '../../../stores/content'
import RichTextEditor from './RichTextEditor.vue'

const props = defineProps({ isEditing: Boolean })
const emit = defineEmits(['saved', 'error', 'saving'])

const { t } = useI18n()
const contentStore = useContentStore()

const form = ref({ title_en: '', title_de: '', about_us_text_en: '', about_us_text_de: '', about_us_image_url: '' })
const previewLanguage = ref('de')

async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  emit('saving', true)
  try {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}_${randomStr}_about.jpg`
    const { data, error } = await supabase.storage.from('meandme_assets').upload(`about/${fileName}`, file)
    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage.from('meandme_assets').getPublicUrl(`about/${fileName}`)
    form.value.about_us_image_url = publicUrl
  } catch (e) { 
    emit('error', e.message) 
  } finally { 
    emit('saving', false) 
    event.target.value = ''
  }
}
const originalData = ref({})

function loadData() {
  if (contentStore.settings) {
    const section = contentStore.sectionTitles.find(s => s.section_key === 'about_us')
    form.value = {
      title_en: section?.title_en || '',
      title_de: section?.title_de || '',
      about_us_text_en: contentStore.settings.about_us_text_en || '',
      about_us_text_de: contentStore.settings.about_us_text_de || '',
      about_us_image_url: contentStore.settings.about_us_image_url || ''
    }
    originalData.value = JSON.parse(JSON.stringify(form.value))
  }
}

onMounted(loadData)
watch(() => contentStore.settings, loadData, { deep: true })
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
    }).eq('section_key', 'about_us')
    
    await supabase.from('site_settings').update({
      about_us_text_en: form.value.about_us_text_en,
      about_us_text_de: form.value.about_us_text_de,
      about_us_image_url: form.value.about_us_image_url
    }).eq('id', 1)
    
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
      <div v-if="!isEditing" class="about-view-md">
        <div class="preview-header-md">
          <div class="gallery-label">Homepage Vorschau ({{ previewLanguage.toUpperCase() }})</div>
          <div class="lang-toggle-md">
            <button @click="previewLanguage = 'de'" :class="{ active: previewLanguage === 'de' }">DE</button>
            <button @click="previewLanguage = 'en'" :class="{ active: previewLanguage === 'en' }">EN</button>
          </div>
        </div>
        <div class="about-homepage-preview">
          <div class="about-content-preview">
            <div class="about-text-preview ql-editor" v-html="previewLanguage === 'de' ? form.about_us_text_de : form.about_us_text_en"></div>
            <img class="profile-img-preview" :src="form.about_us_image_url || '/images/IMG_2003.jpg'" alt="Profile">
          </div>
        </div>
      </div>
      <div v-else>
        <div class="editor-field-group">
          <label class="editor-label">Text (EN)</label>
          <RichTextEditor v-model="form.about_us_text_en" placeholder="Über Uns auf Englisch..." />
        </div>
        <div class="editor-field-group">
          <label class="editor-label">Text (DE)</label>
          <RichTextEditor v-model="form.about_us_text_de" placeholder="Über Uns auf Deutsch..." />
        </div>

        <div class="image-mgmt">
          <div class="gallery-label">Bild</div>
          <div class="about-img-box">
            <img :src="form.about_us_image_url || '/images/IMG_2003.jpg'" />
          </div>
          <label v-if="isEditing" class="btn-upload-md">
            <input type="file" @change="handleImageUpload" accept="image/*" class="hidden" />
            <span>Bild ändern</span>
          </label>
        </div>
        
        <div class="preview-section">
          <div class="preview-header-md">
            <div class="gallery-label">Homepage Vorschau ({{ previewLanguage.toUpperCase() }})</div>
            <div class="lang-toggle-md">
              <button @click="previewLanguage = 'de'" :class="{ active: previewLanguage === 'de' }">DE</button>
              <button @click="previewLanguage = 'en'" :class="{ active: previewLanguage === 'en' }">EN</button>
            </div>
          </div>
          <div class="about-homepage-preview">
            <div class="about-content-preview">
              <div class="about-text-preview ql-editor" v-html="previewLanguage === 'de' ? form.about_us_text_de : form.about_us_text_en"></div>
              <img class="profile-img-preview" :src="form.about_us_image_url || '/images/IMG_2003.jpg'" alt="Profile">
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }

.preview-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px dashed var(--md-outline);
}

.preview-header-md {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.lang-toggle-md {
    display: flex;
    background: var(--md-surface-container-high);
    border-radius: 16px;
    padding: 2px;
}

.lang-toggle-md button {
    background: none;
    border: none;
    padding: 4px 12px;
    font-family: var(--md-font-sans);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--md-on-surface-variant);
    cursor: pointer;
    border-radius: 14px;
    transition: all 0.2s;
}

.lang-toggle-md button.active {
    background: var(--md-primary);
    color: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.gallery-label { 
    font-family: var(--md-font-sans); 
    font-size: 0.6875rem; 
    text-transform: uppercase; 
    font-weight: 500; 
    color: var(--md-on-surface-variant);
    margin-bottom: 0.75rem;
}

.about-homepage-preview {
    background-color: #deefef;
    padding: 4rem 2rem;
    text-align: center;
    border-radius: 0;
    color: #575756;
}

.about-content-preview {
    max-width: 800px;
    margin: 0 auto;
}

.about-text-preview.ql-editor {
    margin-bottom: 2rem;
    text-align: center;
}

.profile-img-preview {
    width: 300px;
    height: 300px;
    border-radius: 50%;
    object-fit: cover;
    margin: 2rem auto 0;
    display: block;
    max-width: 100%;
}

.image-mgmt { margin-top: 2rem; }
.about-img-box { width: 100%; max-width: 200px; aspect-ratio: 1/1; margin: 0.75rem 0; overflow: hidden; }
.about-img-box img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }

.btn-upload-md { display: block; width: fit-content; padding: 10px 24px; background: var(--md-primary); color: white; border-radius: 20px; font-family: var(--md-font-sans); font-size: 0.8125rem; cursor: pointer; font-weight: 500; transition: filter 0.15s; }
.btn-upload-md:hover { filter: brightness(1.05); }
.hidden { display: none; }

.editor-field-group { margin-bottom: 1.5rem; }
.editor-label { font-family: var(--md-font-sans); font-size: 0.6875rem; font-weight: 500; color: var(--md-on-surface-variant); text-transform: uppercase; letter-spacing: 0.04em; margin-left: 4px; margin-bottom: 4px; }

@media (max-width: 768px) { 
  .form-grid { grid-template-columns: 1fr; gap: 1rem; } 
  .about-homepage-preview { padding: 2rem 1rem; }
  .profile-img-preview { width: 220px; height: 220px; }
  .edit-section { padding: 1.5rem !important; }
}
</style>
