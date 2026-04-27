<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../../stores/auth';

// Import CMS components
import HeaderManager from './components/HeaderManager.vue';
import CollectionManager from './components/CollectionManager.vue';
import InspirationManager from './components/InspirationManager.vue';
import BrandManager from './components/BrandManager.vue';
import StoreManager from './components/StoreManager.vue';
import ContactManager from './components/ContactManager.vue';
import AboutManager from './components/AboutManager.vue';
import FooterManager from './components/FooterManager.vue';
import ImprintManager from './components/ImprintManager.vue';
import PrivacyManager from './components/PrivacyManager.vue';
import SEOManager from './components/SEOManager.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const currentTab = ref('collection');
const isEditingGlobal = ref(false);
const isSavingGlobal = ref(false);
const successMsg = ref('');
const activeManagerRef = ref(null);
const isSidebarOpen = ref(false);

function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value;
}

const componentsMap = {
    header: HeaderManager,
    collection: CollectionManager,
    inspiration: InspirationManager,
    brands: BrandManager,
    stores: StoreManager,
    contact: ContactManager,
    about: AboutManager,
    footer: FooterManager,
    imprint: ImprintManager,
    privacy: PrivacyManager,
    seo: SEOManager
};

const activeComponent = computed(() => componentsMap[currentTab.value]);

const navItems = [
    { key: 'header' },
    { key: 'collection' },
    { key: 'brands' },
    { key: 'stores' },
    { key: 'contact' },
    { key: 'inspiration' },
    { key: 'about' },
    { key: 'footer' },
    { key: 'imprint' },
    { key: 'privacy' },
    { key: 'seo' }
];

function startEdit() {
    isEditingGlobal.value = true;
}

function cancelEdit() {
    if (activeManagerRef.value?.cancelEdit) {
        activeManagerRef.value.cancelEdit();
    }
    isEditingGlobal.value = false;
}

async function triggerSave() {
    if (activeManagerRef.value?.saveAll) {
        await activeManagerRef.value.saveAll();
    } else if (activeManagerRef.value?.saveSocials) {
        await activeManagerRef.value.saveSocials();
    } else if (activeManagerRef.value?.saveFooter) {
        await activeManagerRef.value.saveFooter();
    }
}

function handleSaved(msg) {
    successMsg.value = msg || t('cms.saved_success');
    isEditingGlobal.value = false;
    setTimeout(() => { successMsg.value = ''; }, 3000);
}

function handleError(msg) {
    alert(msg);
}

watch(currentTab, () => {
    isEditingGlobal.value = false;
    successMsg.value = '';
});

async function handleLogout() {
    await authStore.logout();
    router.push({ name: 'home' });
}
</script>

<template>
    <div :class="['cms-wrapper', { 'sidebar-open': isSidebarOpen }]">
        <div class="sidebar-overlay" @click="isSidebarOpen = false"></div>
        <aside class="cms-sidebar">
            <div class="sidebar-top">
                <div class="cms-logo-text">
                    <span class="brand">me&me</span>
                    <span class="product">Content<br>Management<br>System</span>
                </div>
                <button class="sidebar-close" @click="isSidebarOpen = false">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <nav class="sidebar-nav">
                <button v-for="item in navItems" 
                        :key="item.key" 
                        :class="['nav-btn', { active: currentTab === item.key }]"
                        @click="currentTab = item.key; isSidebarOpen = false">
                    {{ t(`cms.${item.key}`) || item.key }}
                </button>
            </nav>
            
            <div class="sidebar-bottom">
                <div class="user-info">
                    <span class="user-email">{{ authStore.user?.email }}</span>
                </div>
                <button class="logout-btn" @click="handleLogout">
                    {{ t('auth.logout') }}
                </button>
            </div>
        </aside>

        <main class="cms-main-content">
            <header class="content-header-fixed">
                <div class="header-content-inner">
                    <div class="header-title-group">
                        <button class="menu-toggle" @click="toggleSidebar">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </button>
                        <h2>{{ t(`cms.${currentTab}`) || currentTab }}</h2>
                    </div>
                    
                    <div class="header-actions">
                        <div v-if="successMsg" class="success-msg-inline">{{ successMsg }}</div>
                        
                        <template v-if="!isEditingGlobal">
                            <button @click="startEdit" class="md-button md-button-outlined">
                                Bearbeiten
                            </button>
                        </template>
                        <template v-else>
                            <button @click="cancelEdit" class="md-button md-button-outlined" :disabled="isSavingGlobal">
                                Abbrechen
                            </button>
                            <button @click="triggerSave" class="md-button md-button-filled" :disabled="isSavingGlobal">
                                {{ isSavingGlobal ? 'Speichert...' : 'Speichern' }}
                            </button>
                        </template>
                    </div>
                </div>
            </header>
            
            <div class="content-container">
                <div class="content-view-host">
                    <component 
                        :is="activeComponent" 
                        ref="activeManagerRef"
                        :is-editing="isEditingGlobal"
                        @saved="handleSaved"
                        @error="handleError"
                        @saving="val => isSavingGlobal = val"
                    />
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
.cms-wrapper {
    display: flex;
    height: 100vh;
    width: 100vw;
    background-color: var(--md-surface-container);
    color: var(--md-on-surface);
    font-family: var(--md-font-sans);
}

/* ---- Sidebar ---- */
.cms-sidebar {
    width: 280px;
    background-color: var(--md-surface);
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--md-outline-variant);
    flex-shrink: 0;
}

.sidebar-top {
    padding: 32px 24px;
    border-bottom: 1px solid var(--md-outline-variant);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sidebar-close {
    display: none;
    background: none;
    border: none;
    color: var(--md-on-surface-variant);
    cursor: pointer;
    padding: 4px;
}

.cms-logo-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.cms-logo-text .brand {
    font-family: var(--md-font-sans);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--md-primary);
    letter-spacing: -0.02em;
    line-height: 1;
}

.cms-logo-text .product {
    font-family: var(--md-font-sans);
    font-size: 0.625rem;
    font-weight: 700;
    color: var(--md-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    line-height: 1.2;
}

.sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
    padding: 8px 12px;
}

.nav-btn {
    display: flex;
    align-items: center;
    height: 40px;
    padding: 0 16px;
    border: none;
    background: transparent;
    border-radius: 20px;
    color: var(--md-on-surface-variant);
    font-family: var(--md-font-sans);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s;
    text-align: left;
    text-transform: capitalize;
    letter-spacing: 0.01em;
}

.nav-btn:hover {
    background-color: rgba(0, 0, 0, 0.04);
}

.nav-btn.active {
    background-color: var(--md-primary-container);
    color: var(--md-on-primary-container);
    font-weight: 600;
}

/* ---- Sidebar Bottom ---- */
.sidebar-bottom {
    margin-top: auto;
    padding: 16px 24px;
    border-top: 1px solid var(--md-outline-variant);
}

.user-info {
    margin-bottom: 12px;
}

.user-email {
    font-family: var(--md-font-sans);
    font-size: 0.8125rem;
    color: var(--md-on-surface-variant);
}

.logout-btn {
    width: 100%;
    height: 36px;
    background: transparent;
    border: 1px solid var(--md-outline);
    color: var(--md-error);
    border-radius: 18px;
    font-family: var(--md-font-sans);
    font-weight: 500;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: background-color 0.15s;
}

.logout-btn:hover {
    background-color: #fce8e6;
    border-color: var(--md-error);
}

/* ---- Main Content ---- */
.cms-main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-width: 0;
}

.content-header-fixed {
    background: var(--md-surface);
    padding: 0 48px;
    min-height: 64px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--md-outline-variant);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-content-inner {
    max-width: 960px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
}

.header-content-inner h2 {
    font-family: var(--md-font-sans);
    font-size: 1.25rem;
    margin: 0;
    font-weight: 500;
    color: var(--md-on-surface);
    line-height: 1.2;
}

.header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.content-container {
    flex: 1;
    padding: 32px 48px;
}

.content-view-host {
    max-width: 960px;
    margin: 0 auto;
}

.success-msg-inline {
    font-family: var(--md-font-sans);
    color: var(--md-success);
    font-weight: 500;
    font-size: 0.8125rem;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    background: #e6f4ea;
    border-radius: 18px;
}

/* ---- Mobile Menu ---- */
.header-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
}

.menu-toggle {
    display: none;
    background: none;
    border: none;
    color: var(--md-on-surface-variant);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
}

.sidebar-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.4);
    z-index: 1000;
}

/* ---- Responsive ---- */
@media (max-width: 1024px) {
    .cms-sidebar {
        position: fixed;
        left: -280px;
        top: 0;
        bottom: 0;
        z-index: 1001;
        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 4px 0 12px rgba(0,0,0,0.1);
    }

    .sidebar-open .cms-sidebar {
        left: 0;
    }

    .sidebar-open .sidebar-overlay {
        display: block;
    }

    .sidebar-close {
        display: flex;
    }

    .menu-toggle {
        display: flex;
    }

    .content-header-fixed {
        padding: 0 16px;
    }

    .content-container {
        padding: 16px;
    }

    .header-actions {
        gap: 4px;
    }

    .md-button {
        padding: 0 12px;
        font-size: 0.75rem;
    }

    .success-msg-inline {
        display: none; /* Hide success msg on small mobile to save space */
    }
}

@media (max-width: 480px) {
    .header-content-inner h2 {
        font-size: 1rem;
    }
    
    .header-actions {
        flex-shrink: 1;
    }
}
</style>
