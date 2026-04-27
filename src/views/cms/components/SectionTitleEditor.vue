<script setup>
import { ref, onMounted, watch } from 'vue';
import { supabase } from '../../../lib/supabase';
import { useContentStore } from '../../../stores/content';

const props = defineProps({
    sectionKey: {
        type: String,
        required: true
    }
});

const contentStore = useContentStore();
const titleEn = ref('');
const titleDe = ref('');
const saving = ref(false);
const success = ref(false);

const loadData = () => {
    const section = contentStore.sectionTitles.find(s => s.section_key === props.sectionKey);
    if (section) {
        titleEn.value = section.title_en;
        titleDe.value = section.title_de;
    }
};

onMounted(loadData);
watch(() => contentStore.sectionTitles, loadData, { deep: true });

async function saveTitle() {
    saving.value = true;
    success.value = false;
    try {
        const { error } = await supabase
            .from('section_titles')
            .update({
                title_en: titleEn.value,
                title_de: titleDe.value
            })
            .eq('section_key', props.sectionKey);
            
        if (error) throw error;
        
        success.value = true;
        await contentStore.fetchAllData();
        setTimeout(() => { success.value = false }, 3000);
    } catch (e) {
        alert("Error saving title: " + e.message);
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <div class="title-editor-card">
        <header class="editor-header">
            <h4>Abschnittstitel</h4>
            <span v-if="success" class="save-indicator">✓ Gespeichert</span>
        </header>
        <div class="editor-body">
            <div class="input-grid">
                <div class="form-group mini">
                    <label>Titel (EN)</label>
                    <input type="text" v-model="titleEn" @blur="saveTitle" :disabled="saving">
                </div>
                <div class="form-group mini">
                    <label>Titel (DE)</label>
                    <input type="text" v-model="titleDe" @blur="saveTitle" :disabled="saving">
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.title-editor-card {
    background: var(--md-surface);
    border: 1px solid var(--md-outline-variant);
    border-radius: 8px;
    margin-bottom: 1.5rem;
    padding: 20px;
}

.editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.editor-header h4 {
    font-family: var(--md-font-sans);
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--md-on-surface-variant);
    font-weight: 600;
    margin: 0;
}

.save-indicator {
    font-family: var(--md-font-sans);
    font-size: 0.75rem;
    color: var(--md-success);
    font-weight: 500;
}

.input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
}

.form-group.mini { margin-bottom: 0; }

.form-group.mini label {
    font-family: var(--md-font-sans);
    font-size: 0.6875rem;
    margin-bottom: 4px;
    display: block;
    color: var(--md-on-surface-variant);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.form-group.mini input {
    width: 100%;
    padding: 10px 12px;
    font-family: var(--md-font-sans);
    font-size: 0.875rem;
    border: 1px solid var(--md-outline);
    border-radius: 4px;
    background: transparent;
    color: var(--md-on-surface);
    outline: none;
    transition: border-color 0.15s;
}

.form-group.mini input:focus {
    border-color: var(--md-primary);
    border-width: 2px;
    padding: 9px 11px;
}

@media (max-width: 768px) {
    .input-grid { grid-template-columns: 1fr; gap: 1rem; }
}
</style>
