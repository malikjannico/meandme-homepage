<script setup>
import { useI18n } from 'vue-i18n';
import { useContentStore } from '../stores/content';
import { computed } from 'vue';

const { t } = useI18n();
const contentStore = useContentStore();

const currentYear = new Date().getFullYear();
const businessName = computed(() => contentStore.settings?.business_name || 'me&me Anja Jäger und Silke Press GbR');
</script>

<template>
    <footer class="footer-main">
        <div class="footer-container">
            <div class="footer-divider"></div>
            <div class="footer-content">
                <nav class="footer-nav">
                    <RouterLink to="/imprint" class="footer-link">{{ t('footer.imprint') }}</RouterLink>
                    <span class="footer-separator">|</span>
                    <RouterLink to="/privacy" class="footer-link">{{ t('footer.privacy') }}</RouterLink>
                </nav>
                
                <div class="footer-info">
                    <p class="copyright">
                        &copy; {{ currentYear }} {{ businessName }}
                    </p>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer-main {
    padding: 0 2rem 4rem;
    background-color: var(--bg-color);
}

.footer-container {
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
}

.footer-divider {
    height: 1px;
    background: rgba(87, 87, 86, 0.1);
    width: 100%;
    margin-bottom: 2rem;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
}

.footer-nav {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.footer-link {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.15em;
    color: var(--text-color);
    text-decoration: none;
    opacity: 0.6;
    transition: opacity 0.3s ease;
}

.footer-link:hover {
    opacity: 1;
}

.footer-separator {
    opacity: 0.2;
    font-size: 0.7rem;
}

.copyright {
    font-size: 0.8rem;
    color: var(--text-color);
    opacity: 0.5;
    font-weight: 400;
    letter-spacing: 0.02em;
}

@media (max-width: 768px) {
    .footer-content {
        flex-direction: column;
        gap: 2rem;
        text-align: center;
    }
    
    .footer-nav {
        justify-content: center;
    }
}
</style>
