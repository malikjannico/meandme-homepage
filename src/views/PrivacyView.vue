<script setup>
import { useI18n } from 'vue-i18n';
import { useContentStore } from '../stores/content';

const { t, locale } = useI18n();
const contentStore = useContentStore();
</script>

<template>
    <div class="section-container legal-page-container">
        <div class="title-line">
            <h2>{{ t('footer.privacy') }}</h2>
        </div>
        
        <div class="legal-content ql-editor" v-if="contentStore.settings">
            <div v-html="locale.startsWith('de') ? contentStore.settings.data_privacy_text_de : contentStore.settings.data_privacy_text_en"></div>
        </div>
        <div class="legal-loading" v-else>
            <p>Lade...</p>
        </div>
    </div>
</template>

<style scoped>
.legal-page-container {
    min-height: 70vh;
    padding-top: 0; /* Touch header */
    display: flex;
    flex-direction: column;
    align-items: center;
}

.legal-content {
    max-width: 800px;
    width: 100%;
    margin: 2rem auto;
    font-size: 1.1rem;
}

.text-center { text-align: center; }
.legal-loading {
    text-align: center;
    padding: 4rem 0;
    font-size: 1.2rem;
    color: #575756;
}
</style>
