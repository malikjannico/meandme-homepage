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

const form = ref({ title_en: '', title_de: '', imprint_text_en: '', imprint_text_de: '' })
const previewLanguage = ref('de')
const originalData = ref({})

function loadData() {
  if (contentStore.settings) {
    const section = contentStore.sectionTitles.find(s => s.section_key === 'imprint')
    form.value = {
      title_en: section?.title_en || '',
      title_de: section?.title_de || '',
      imprint_text_en: contentStore.settings.imprint_text_en || '',
      imprint_text_de: contentStore.settings.imprint_text_de || ''
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
    }).eq('section_key', 'imprint')
    
    await supabase.from('site_settings').update({
      imprint_text_en: form.value.imprint_text_en,
      imprint_text_de: form.value.imprint_text_de
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
      <div v-if="!isEditing" class="legal-view-md">
        <div class="preview-header-md">
          <div class="gallery-label">Homepage Vorschau ({{ previewLanguage.toUpperCase() }})</div>
          <div class="lang-toggle-md">
            <button @click="previewLanguage = 'de'" :class="{ active: previewLanguage === 'de' }">DE</button>
            <button @click="previewLanguage = 'en'" :class="{ active: previewLanguage === 'en' }">EN</button>
          </div>
        </div>
        <div class="legal-homepage-preview">
          <div class="legal-content-preview ql-editor" v-html="previewLanguage === 'de' ? form.imprint_text_de : form.imprint_text_en"></div>
        </div>
      </div>
      <div v-else>
        <div class="editor-field-group">
          <label class="editor-label">Text (EN)</label>
          <RichTextEditor v-model="form.imprint_text_en" placeholder="Impressum auf Englisch..." />
        </div>
        <div class="editor-field-group">
          <label class="editor-label">Text (DE)</label>
          <RichTextEditor v-model="form.imprint_text_de" placeholder="Impressum auf Deutsch..." />
        </div>
        
        <div class="preview-section">
          <div class="preview-header-md">
            <div class="gallery-label">Homepage Vorschau ({{ previewLanguage.toUpperCase() }})</div>
            <div class="lang-toggle-md">
              <button @click="previewLanguage = 'de'" :class="{ active: previewLanguage === 'de' }">DE</button>
              <button @click="previewLanguage = 'en'" :class="{ active: previewLanguage === 'en' }">EN</button>
            </div>
          </div>
          <div class="legal-homepage-preview">
            <div class="legal-content-preview ql-editor" v-html="previewLanguage === 'de' ? form.imprint_text_de : form.imprint_text_en"></div>
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

.legal-homepage-preview {
    background-color: #deefef;
    padding: 4rem 2rem;
    text-align: center;
    border-radius: 0;
    color: #575756;
    min-height: 400px;
}

.legal-content-preview :deep(a) { color: var(--md-primary); text-decoration: underline; }

.editor-field-group { margin-bottom: 1.5rem; }
.editor-label { font-family: var(--md-font-sans); font-size: 0.6875rem; font-weight: 500; color: var(--md-on-surface-variant); text-transform: uppercase; letter-spacing: 0.04em; margin-left: 4px; margin-bottom: 4px; }

@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>
