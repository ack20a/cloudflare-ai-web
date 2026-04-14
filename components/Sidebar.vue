<script setup lang="ts">
import {useGlobalState} from "~/utils/store";

const {openAside} = useGlobalState()

defineProps<{
  tabs: TabItem[]
  selected: number

  handleNewChat: () => void
  handleDelete: (tid: number) => void
  handleSwitchChat: (e: MouseEvent) => void
}>()
</script>

<template>
  <div class="aside-mask" :class="{'aside-mask--visible': openAside}" @click="openAside = !openAside"></div>

  <aside class="sidebar" :class="openAside ? 'sidebar--open' : 'sidebar--closed'">
    <div class="sidebar-header">
      <button @click="handleNewChat" class="btn btn-secondary new-chat-btn" type="button">
        <div class="new-chat-label">
          <div class="new-chat-icon-wrap">
            <UIcon name="i-heroicons-plus" class="icon-16"/>
          </div>
          <span>{{ $t('new_chat') }}</span>
        </div>
        <UIcon name="i-heroicons-pencil-square" class="icon-16 new-chat-edit-icon"/>
      </button>
    </div>

    <div class="tab-list">
      <div v-if="tabs.length > 0" class="tab-list-title">Today</div>

      <div
        v-for="i in tabs"
        :key="i.id"
        class="tab-item"
        :class="{'tab-item--active': i.id === selected}"
        @click="handleSwitchChat"
        :data-id="i.id"
      >
        <div class="tab-label" :data-id="i.id">{{ i.label }}</div>
        <button
          v-if="i.id === selected"
          @click.stop="handleDelete(i.id)"
          class="tab-delete-btn"
          type="button"
        >
          <UIcon name="i-heroicons-trash" class="icon-16"/>
        </button>
      </div>
    </div>

    <div class="profile-wrap">
      <button class="profile-btn" type="button">
        <div class="profile-avatar">AC</div>
        <div class="profile-name">牛永康</div>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.aside-mask {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--color-neutral-900) 35%, transparent);
}

.aside-mask--visible {
  display: block;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-neutral-50);
  border-right: 1px solid var(--color-neutral-200);
  transition: width var(--duration-base) ease, transform var(--duration-base) ease, opacity var(--duration-base) ease;
}

.sidebar--open {
  width: var(--layout-sidebar-width);
  transform: translateX(0);
  opacity: 1;
}

.sidebar--closed {
  width: 0;
  transform: translateX(-100%);
  opacity: 0;
  overflow: hidden;
}

.sidebar-header {
  padding-top: var(--space-3);
  padding-right: var(--space-3);
  padding-bottom: 0;
  padding-left: var(--space-3);
}

.new-chat-btn {
  width: 100%;
  justify-content: space-between;
  padding-right: var(--space-3);
  padding-left: var(--space-3);
}

.new-chat-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.new-chat-icon-wrap {
  width: var(--space-6);
  height: var(--space-6);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: var(--color-neutral-0);
}

.new-chat-edit-icon {
  color: var(--color-neutral-400);
}

.tab-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2) var(--space-3);
}

.tab-list-title {
  margin-bottom: var(--space-2);
  padding: var(--space-1) var(--space-2);
  color: var(--color-neutral-500);
  font-size: var(--text-xs);
  font-weight: 600;
}

.tab-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--color-neutral-500);
  cursor: pointer;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.tab-item + .tab-item {
  margin-top: var(--space-2);
}

.tab-item:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

.tab-item--active {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

.tab-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
}

.tab-delete-btn {
  width: var(--space-6);
  height: var(--space-6);
  padding: var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-neutral-400);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color var(--duration-fast) ease, background-color var(--duration-fast) ease;
}

.tab-delete-btn:hover {
  background: var(--color-neutral-0);
  color: var(--color-error);
}

.profile-wrap {
  padding-top: var(--space-3);
  padding-right: var(--space-3);
  padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom));
  padding-left: var(--space-3);
  border-top: 1px solid var(--color-neutral-200);
}

.profile-btn {
  width: 100%;
  padding: var(--space-2);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-neutral-500);
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
}

.profile-btn:hover {
  background: var(--color-neutral-100);
  color: var(--color-neutral-900);
}

.profile-avatar {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-sm);
  background: var(--color-secondary);
  color: var(--color-neutral-0);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 600;
}

.profile-name {
  flex: 1;
  text-align: left;
  font-size: var(--text-sm);
  font-weight: 600;
}

.icon-16 {
  width: var(--space-4);
  height: var(--space-4);
}

@media (min-width: 768px) {
  .aside-mask,
  .aside-mask--visible {
    display: none;
  }

  .sidebar {
    position: relative;
    z-index: 0;
  }

  .sidebar--open,
  .sidebar--closed {
    width: var(--layout-sidebar-width);
    transform: translateX(0);
    opacity: 1;
    overflow: visible;
  }
}
</style>