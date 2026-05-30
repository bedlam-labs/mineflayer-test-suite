<script lang="ts">
  import TestPanel from './lib/TestPanel.svelte';
  import ViewerPanel from './lib/ViewerPanel.svelte';

  let panelWidth = $state(380);
  let dragging = $state(false);
  let dividerEl: HTMLDivElement;

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    dividerEl.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    e.preventDefault();
    panelWidth = Math.max(260, Math.min(e.clientX, window.innerWidth - 200));
  }

  function onPointerUp(e: PointerEvent) {
    dragging = false;
    dividerEl.releasePointerCapture(e.pointerId);
  }
</script>

<div class="layout" class:dragging>
  <div class="panel-left" style="width:{panelWidth}px">
    <TestPanel />
  </div>
  <div
    class="divider"
    role="separator"
    aria-orientation="vertical"
    bind:this={dividerEl}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
  ></div>
  <div class="panel-right">
    {#if dragging}<div class="drag-overlay"></div>{/if}
    <ViewerPanel />
  </div>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(html), :global(body) {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    background: #0e0e0e;
    color: #ccc;
    font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  }

  :global(#app) {
    height: 100%;
  }

  .layout {
    display: flex;
    height: 100%;
  }

  .layout.dragging {
    cursor: col-resize;
    user-select: none;
  }

  .panel-left {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #111;
    overflow: hidden;
  }

  .divider {
    width: 5px;
    cursor: col-resize;
    background: #1a1a1a;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  .divider:hover, .layout.dragging .divider {
    background: #3a3a3a;
  }

  .panel-right {
    flex: 1;
    min-width: 200px;
    overflow: hidden;
    position: relative;
  }

  .drag-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    cursor: col-resize;
  }
</style>
