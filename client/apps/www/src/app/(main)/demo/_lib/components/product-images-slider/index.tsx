"use client";

import { FollowCursor } from "@/components/follow-cursor";
import { FollowCursorProvider } from "@/components/follow-cursor/provider";
import {
  HorizontalScroll,
  type ScrollHandle,
} from "@/components/horizontal-scroll";
import { Drawer } from "@jamsr-ui/react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { imagesItems } from "../image";
import { CloseBtn } from "./close-btn";
import { NavigationNextBtn, NavigationPrevBtn } from "./navigation-btn";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClose: () => void;
  activeIndex: number;
};

export const ProductImagesSlider = (props: Props) => {
  const { isOpen, onOpenChange, onClose, activeIndex } = props;
  const [scrollRef, setScrollRef] = useState<ScrollHandle | null>(null);
  const handleNext = () => {
    scrollRef?.slideRight();
  };
  const handlePrev = () => {
    scrollRef?.slideLeft();
  };
  const parentDom = scrollRef?.current;

  const targetRef = useCallback((node: HTMLLIElement | null) => {
    if (!node) return;
    setTimeout(() => {
      node.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }, 1000);
  }, []);
  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="full"
      anchor="bottom"
      className="relative"
    >
      <FollowCursorProvider>
        <NavigationPrevBtn
          onClick={handlePrev}
          isDisabled={!scrollRef?.canSlideLeft}
        />
        <NavigationNextBtn
          onClick={handleNext}
          isDisabled={!scrollRef?.canSlideRight}
        />
        <FollowCursor parentDom={parentDom} />
        <CloseBtn onClose={onClose} />
      </FollowCursorProvider>
      <HorizontalScroll ref={setScrollRef}>
        <ul className="flex">
          {imagesItems.map((item, idx) => {
            return (
              <li
                key={idx}
                className="shrink-0"
                ref={activeIndex === idx ? targetRef : null}
              >
                <Image
                  alt="product image"
                  src={item.item}
                  className="pointer-events-none h-dvh w-auto shrink-0"
                />
              </li>
            );
          })}
        </ul>
      </HorizontalScroll>
    </Drawer>
  );
};
