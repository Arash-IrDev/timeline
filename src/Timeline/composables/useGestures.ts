import { zoomer, type WheelGesture } from "../utilities/zoomer";
import { MAX_SCALE, useTimelineStore } from "../../Timeline/timelineStore";
import { onMounted, onUnmounted, ref, watch, type Ref } from "vue";
// @ts-ignore
import Hammer from "@squadette/hammerjs";

export const useGestures = (
  el: Ref<HTMLElement | undefined>,
  onSetScale: () => void = () => {}
) => {
  const timelineStore = useTimelineStore();

  let endGesture = () => {};
  const isZooming = ref(false);
  let startingZoom: number | null = null;
  let pinchStartScrollTop: number | null,
    pinchStartScrollLeft: number | null,
    pinchStartCenterX: number | null,
    pinchStartCenterY: number | null;

  let mc: Hammer.Manager;

  const pinch = (e: any) => {
    e.preventDefault();
    const offsetLeft = el.value!.offsetLeft;

    if (!startingZoom) {
      isZooming.value = true;
      startingZoom = timelineStore.pageScale;
      pinchStartScrollTop = el.value!.scrollTop;
      pinchStartScrollLeft = el.value!.scrollLeft - offsetLeft;
      pinchStartCenterX = e.center.x;
      pinchStartCenterY = e.center.y;
    }

    const newScrollTop = pinchStartScrollTop! + pinchStartCenterY! - e.center.y;
    let scale = e.scale;
    if (startingZoom! * scale > MAX_SCALE) {
      scale = 1;
    }

    if (scale !== 1 && timelineStore.setPageScale(startingZoom! * e.scale)) {
      const newScrollLeft =
        scale * (pinchStartScrollLeft! + pinchStartCenterX!) -
        (e.center.x! - offsetLeft);

      el.value!.scrollLeft = newScrollLeft;
      el.value!.scrollTop = newScrollTop;
      onSetScale();
    }
  };

  const pinchEnd = (e: Event) => {
    e.preventDefault();
    isZooming.value = false;
    startingZoom = null;
    pinchStartScrollLeft = null;
    pinchStartScrollTop = null;
    pinchStartCenterX = null;
    pinchStartCenterY = null;
  };

  const startGesture = (wg: WheelGesture) => {
    isZooming.value = true;
    if (!startingZoom) {
      startingZoom = timelineStore.pageScale;

      pinchStartScrollTop = el.value!.scrollTop;
      pinchStartScrollLeft = el.value!.scrollLeft;
      pinchStartCenterX =
        wg.origin.x - (el.value!.offsetLeft + timelineStore.leftInsetWidth);
      pinchStartCenterY = wg.origin.y;
    }
  };

  const doGesture = (wg: WheelGesture) => {
    const scale = startingZoom! * wg.scale;
    if (scale > MAX_SCALE) {
      return;
    }
    isZooming.value = true;

    if (timelineStore.setPageScale(scale)) {
      const offsetLeft =
        (el.value! as HTMLElement).offsetLeft + timelineStore.leftInsetWidth;
      const newScrollLeft =
        wg.scale * (pinchStartScrollLeft! + pinchStartCenterX!) -
        (wg.origin.x! - offsetLeft);
      const newScrollTop =
        pinchStartScrollTop! + pinchStartCenterY! - wg.origin.y;

      el.value!.scrollLeft = newScrollLeft;
      el.value!.scrollTop = newScrollTop;
      onSetScale();
    }

    startingZoom = null;
    pinchStartScrollLeft = null;
    pinchStartScrollTop = null;
    pinchStartCenterX = null;
    pinchStartCenterY = null;

    isZooming.value = false;
    endGesture();
  };

  const gestures = {
    startGesture,
    doGesture,
  };

  const touchStart = (e: TouchEvent) => {
    if (e.touches.length >= 2) {
      mc.get("pinch").set({ enable: true });
      e.preventDefault();
    }
  };

  const touchEnd = (e: TouchEvent) => {
    if (e.touches.length <= 2) {
      mc.get("pinch").set({ enable: false });
    }
  };

  const setupHammer = () => {
    mc = new Hammer.Manager(el.value, {
      recognizers: [
        [Hammer.Pinch, { enable: false, touchAction: 'none' }]
      ]
    });
    mc.on("pinch", pinch);
    mc.on("pinchend", pinchEnd);
    el.value?.addEventListener("touchstart", touchStart);
    el.value?.addEventListener("touchend", touchEnd, { passive: true });
  };

  onMounted(() => {
    endGesture = zoomer(el.value!, gestures);
    setupHammer();
  });

  onUnmounted(() => {
    el.value?.removeEventListener("touchstart", touchStart);
    el.value?.removeEventListener("touchend", touchEnd);
  });

  return isZooming;
};
