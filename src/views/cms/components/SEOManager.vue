<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { supabase } from '../../../lib/supabase'
import { useContentStore } from '../../../stores/content'

const props = defineProps({ isEditing: Boolean })
const emit = defineEmits(['saved', 'error', 'saving'])

const contentStore = useContentStore()
const uploading = ref(false)

const form = ref({
  meta_title_de: '',
  meta_title_en: '',
  meta_description_de: '',
  meta_description_en: '',
  og_image_url: ''
})

const originalData = ref({})

function loadData() {
  if (contentStore.settings) {
    form.value = {
      meta_title_de: contentStore.settings.meta_title_de || '',
      meta_title_en: contentStore.settings.meta_title_en || '',
      meta_description_de: contentStore.settings.meta_description_de || '',
      meta_description_en: contentStore.settings.meta_description_en || '',
      og_image_url: contentStore.settings.og_image_url || ''
    }
    originalData.value = JSON.parse(JSON.stringify(form.value))
  }
}

onMounted(loadData)
watch(() => contentStore.settings, loadData, { deep: true })

function cancelEdit() {
  form.value = JSON.parse(JSON.stringify(originalData.value))
}

async function saveAll() {
  emit('saving', true)
  try {
    await supabase.from('site_settings').update({
      meta_title_de: form.value.meta_title_de,
      meta_title_en: form.value.meta_title_en,
      meta_description_de: form.value.meta_description_de,
      meta_description_en: form.value.meta_description_en,
      og_image_url: form.value.og_image_url
    }).eq('id', 1)
    
    await contentStore.fetchAllData()
    emit('saved', 'SEO Einstellungen gespeichert')
  } catch (e) {
    emit('error', e.message)
  } finally {
    emit('saving', false)
  }
}

async function handleOGImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  uploading.value = true
  try {
    const fileName = `${Date.now()}_social_share.jpg`
    await supabase.storage.from('meandme_assets').upload(`seo/${fileName}`, file)
    const { data: { publicUrl } } = supabase.storage.from('meandme_assets').getPublicUrl(`seo/${fileName}`)
    
    form.value.og_image_url = publicUrl
    // Immediate update for better UX
    await supabase.from('site_settings').update({ og_image_url: publicUrl }).eq('id', 1)
    await contentStore.fetchAllData()
    emit('saved', 'Social Media Bild aktualisiert')
  } catch (e) {
    emit('error', e.message)
  } finally {
    uploading.value = false
  }
}

defineExpose({ saveAll, cancelEdit })
</script>

<template>
  <div class="management-page">
    <!-- Google Preview Section -->
    <section class="edit-section md-card preview-section">
      <h3>Google Vorschau</h3>
      <div class="google-preview">
        <div class="preview-title">{{ form.meta_title_de || 'me & me - Mode und Accessoires' }}</div>
        <div class="preview-url">https://meandme-fashion.de</div>
        <div class="preview-description">
          {{ form.meta_description_de || 'Entdecken Sie die neuesten Mode-Trends und exklusiven Accessoires bei me & me. Besuchen Sie unsere Stores in Potsdam.' }}
        </div>
      </div>
    </section>

    <!-- Meta Titles Section -->
    <section class="edit-section md-card">
      <h3>Browser Titel (DE/EN)</h3>
      <p class="section-hint">Der Titel, der im Browser-Tab und in Suchergebnissen erscheint.</p>
      
      <div v-if="!isEditing" class="form-grid">
        <div class="read-only-field">
          <div class="read-only-label">Titel (DE)</div>
          <div class="read-only-value">{{ form.meta_title_de || '-' }}</div>
        </div>
        <div class="read-only-field">
          <div class="read-only-label">Titel (EN)</div>
          <div class="read-only-value">{{ form.meta_title_en || '-' }}</div>
        </div>
      </div>
      
      <div v-else class="form-grid">
        <div class="md-text-field">
          <input type="text" v-model="form.meta_title_de" id="meta_title_de" placeholder="Max. 60 Zeichen empfohlen" />
          <label for="meta_title_de">Meta Titel (DE)</label>
        </div>
        <div class="md-text-field">
          <input type="text" v-model="form.meta_title_en" id="meta_title_en" placeholder="Max. 60 characters recommended" />
          <label for="meta_title_en">Meta Titel (EN)</label>
        </div>
      </div>
    </section>

    <!-- Meta Descriptions Section -->
    <section class="edit-section md-card">
      <h3>Seitenbeschreibung (DE/EN)</h3>
      <p class="section-hint">Eine kurze Zusammenfassung des Inhalts für Suchmaschinen.</p>
      
      <div v-if="!isEditing" class="form-grid">
        <div class="read-only-field">
          <div class="read-only-label">Beschreibung (DE)</div>
          <div class="read-only-value">{{ form.meta_description_de || '-' }}</div>
        </div>
        <div class="read-only-field">
          <div class="read-only-label">Beschreibung (EN)</div>
          <div class="read-only-value">{{ form.meta_description_en || '-' }}</div>
        </div>
      </div>
      
      <div v-else class="form-grid">
        <div class="md-text-field">
          <textarea v-model="form.meta_description_de" rows="4" id="meta_description_de" placeholder="Max. 160 Zeichen empfohlen"></textarea>
          <label for="meta_description_de">Meta Beschreibung (DE)</label>
        </div>
        <div class="md-text-field">
          <textarea v-model="form.meta_description_en" rows="4" id="meta_description_en" placeholder="Max. 160 characters recommended"></textarea>
          <label for="meta_description_en">Meta Beschreibung (EN)</label>
        </div>
      </div>
    </section>

    <!-- Social Media Sharing Image -->
    <section class="edit-section md-card">
      <h3>Social Media Bild (Open Graph)</h3>
      <p class="section-hint">Dieses Bild erscheint, wenn der Link auf Plattformen wie Instagram, WhatsApp oder Facebook geteilt wird.</p>
      
        <div class="og-image-manager">
          <div class="og-image-preview" :class="{ 'empty': !form.og_image_url }">
            <img v-if="form.og_image_url" :src="form.og_image_url" alt="Social Share Preview" />
            <div v-else class="no-image">Kein Bild ausgewählt</div>
          </div>
          <div v-if="isEditing" class="og-actions">
            <label class="btn-upload-md">
              <input type="file" @change="handleOGImageUpload" accept="image/*" class="hidden" :disabled="uploading" />
              <span>{{ uploading ? 'LÄDT...' : 'BILD ÄNDERN' }}</span>
            </label>
            <div class="og-info">
              <div class="info-tag">Empfohlen: 1200 x 630 px</div>
              <div class="info-tag">Format: JPG/PNG</div>
            </div>
          </div>
        </div>
    </section>
  </div>
</template>

<style scoped>
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.section-hint { font-family: var(--md-font-sans); font-size: 0.8125rem; color: var(--md-on-surface-variant); margin-top: -0.25rem; margin-bottom: 1.25rem; line-height: 1.5; }

/* Google Preview Styling */
.google-preview {
  background: var(--md-surface);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--md-outline-variant);
  max-width: 600px;
  margin-top: 0.75rem;
  font-family: Arial, sans-serif;
}
.preview-title { font-size: 1.25rem; color: #1a0dab; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.preview-url { font-size: 0.8125rem; color: #006621; margin-bottom: 4px; }
.preview-description { font-size: 0.8125rem; color: #545454; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* OG Image Manager */
.og-image-manager { display: flex; align-items: start; gap: 1.5rem; margin-top: 0.75rem; }
.og-image-preview {
  width: 280px;
  aspect-ratio: 1.91/1;
  background: var(--md-surface-container);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--md-outline-variant);
}
.og-image-preview.empty { display: flex; align-items: center; justify-content: center; border: 2px dashed var(--md-outline); }
.og-image-preview img { width: 100%; height: 100%; object-fit: cover; }
.no-image { font-family: var(--md-font-sans); font-size: 0.75rem; color: var(--md-on-surface-variant); font-weight: 500; }

.og-actions { display: flex; flex-direction: column; gap: 1rem; }

.btn-upload-md { display: block; width: fit-content; padding: 10px 24px; background: var(--md-primary); color: white; border-radius: 20px; font-family: var(--md-font-sans); font-size: 0.8125rem; cursor: pointer; font-weight: 500; transition: filter 0.15s; }
.btn-upload-md:hover { filter: brightness(1.05); }

.og-info { display: flex; flex-direction: column; gap: 6px; }
.info-tag { font-family: var(--md-font-sans); font-size: 0.6875rem; color: var(--md-on-surface-variant); padding: 4px 0; font-weight: 500; }

.hidden { display: none; }

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; gap: 0; }
  .og-image-manager { flex-direction: column; align-items: center; }
  .og-image-preview { width: 100%; max-width: 360px; }
}
</style>
