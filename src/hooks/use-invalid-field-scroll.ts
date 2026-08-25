import {
  useCallback,
  useRef,
} from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";

export function useInvalidFieldScroll<
  T extends string,
>() {
  const scrollRef =
    useRef<ScrollView>(
      null,
    );

  const currentScrollY =
    useRef(0);

  const fieldRefs =
    useRef<
      Partial<
        Record<
          T,
          View | null
        >
      >
    >({});

  const refCallbacks =
    useRef<
      Partial<
        Record<
          T,
          (
            node:
              | View
              | null,
          ) => void
        >
      >
    >({});

  const bindField =
    useCallback(
      (key: T) => {
        if (
          !refCallbacks.current[
            key
          ]
        ) {
          refCallbacks.current[
            key
          ] = (
            node:
              | View
              | null,
          ) => {
            fieldRefs.current[
              key
            ] = node;
          };
        }

        return refCallbacks.current[
          key
        ]!;
      },
      [],
    );

  const onScroll =
    useCallback(
      (
        event:
          NativeSyntheticEvent<NativeScrollEvent>,
      ) => {
        currentScrollY.current =
          event.nativeEvent.contentOffset.y;
      },
      [],
    );

  const scrollToField =
    useCallback(
      (key: T) => {
        const node =
          fieldRefs.current[
            key
          ];

        if (!node) {
          return;
        }

        requestAnimationFrame(
          () => {
            node.measureInWindow(
              (
                _x,
                y,
              ) => {
                const targetY =
                  Math.max(
                    0,
                    currentScrollY.current +
                      y -
                      145,
                  );

                scrollRef.current?.scrollTo(
                  {
                    y: targetY,
                    animated:
                      true,
                  },
                );
              },
            );
          },
        );
      },
      [],
    );

  return {
    scrollRef,
    bindField,
    onScroll,
    scrollToField,
  };
}

