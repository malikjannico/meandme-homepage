<template>
  <section class="section fade-in">
    <div class="contact-card glass">
      <h2 class="sr-only">{{ t('contact.title') }}</h2>
      <h3 class="business-name">{{ contentStore.settings?.business_name }}</h3>
      <p class="email-label">{{ t('contact.email') }}</p>
      <a :href="'mailto:' + contentStore.settings?.contact_email" class="email-link">
        {{ contentStore.settings?.contact_email }}
      </a>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useContentStore } from '../stores/content'

const { t } = useI18n()
const contentStore = useContentStore()
</script>

<style scoped>
.contact-card {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 8px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.business-name {
  font-family: var(--font-title);
  font-size: 2rem;
  margin-bottom: 1.5rem;
  letter-spacing: 1px;
}

.email-label {
  color: var(--text-color);
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.email-link {
  font-size: 1.2rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 4px;
}

.email-link:hover {
  opacity: 0.7;
}
</style>
