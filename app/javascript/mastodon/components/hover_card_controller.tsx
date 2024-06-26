import { useEffect, useRef, useState, useCallback } from 'react';

import { useLocation } from 'react-router-dom';

import Overlay from 'react-overlays/Overlay';
import type {
  OffsetValue,
  UsePopperOptions,
} from 'react-overlays/esm/usePopper';

import { useTimeout } from 'mastodon/../hooks/useTimeout';
import { HoverCardAccount } from 'mastodon/components/hover_card_account';

const offset = [-12, 4] as OffsetValue;
const enterDelay = 500;
const leaveDelay = 250;
const popperConfig = { strategy: 'fixed' } as UsePopperOptions;

const isHoverCardAnchor = (element: HTMLElement) =>
  element.matches('[data-hover-card-account]');

export const HoverCardController: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const scrollingRef = useRef<boolean>(false);
  const [setLeaveTimeout, cancelLeaveTimeout] = useTimeout();
  const [setEnterTimeout, cancelEnterTimeout, delayEnterTimeout] = useTimeout();
  const [setScrollTimeout] = useTimeout();
  const location = useLocation();

  const handleClose = useCallback(() => {
    cancelEnterTimeout();
    cancelLeaveTimeout();
    setOpen(false);
    setAnchor(null);
  }, [cancelEnterTimeout, cancelLeaveTimeout, setOpen, setAnchor]);

  useEffect(() => {
    handleClose();
  }, [handleClose, location]);

  useEffect(() => {
    const handleMouseEnter = (e: MouseEvent) => {
      const { target } = e;

      if (scrollingRef.current) {
        return;
      }

      if (target instanceof HTMLElement && isHoverCardAnchor(target)) {
        cancelLeaveTimeout();

        setEnterTimeout(() => {
          anchorRef.current = target;
          target.setAttribute('aria-describedby', 'hover-card');
          setAnchor(target);
          setOpen(true);
          setAccountId(
            target.getAttribute('data-hover-card-account') ?? undefined,
          );
        }, enterDelay);
      }

      if (target === cardRef.current?.parentNode) {
        cancelLeaveTimeout();
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (
        e.target === anchorRef.current ||
        e.target === cardRef.current?.parentNode
      ) {
        cancelEnterTimeout();

        setLeaveTimeout(() => {
          anchorRef.current?.removeAttribute('aria-describedby');
          setOpen(false);
          setAnchor(null);
        }, leaveDelay);
      }
    };

    const handleScrollEnd = () => {
      scrollingRef.current = false;
    };

    const handleScroll = () => {
      scrollingRef.current = true;
      cancelEnterTimeout();
      setScrollTimeout(handleScrollEnd, 100);
    };

    const handleMouseMove = () => {
      delayEnterTimeout(enterDelay);
    };

    document.body.addEventListener('mouseenter', handleMouseEnter, {
      passive: true,
      capture: true,
    });

    document.body.addEventListener('mousemove', handleMouseMove, {
      passive: true,
      capture: false,
    });

    document.body.addEventListener('mouseleave', handleMouseLeave, {
      passive: true,
      capture: true,
    });

    document.addEventListener('scroll', handleScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [
    setEnterTimeout,
    setLeaveTimeout,
    setScrollTimeout,
    cancelEnterTimeout,
    cancelLeaveTimeout,
    delayEnterTimeout,
    setOpen,
    setAccountId,
    setAnchor,
  ]);

  return (
    <Overlay
      rootClose
      onHide={handleClose}
      show={open}
      target={anchor}
      placement='bottom-start'
      flip
      offset={offset}
      popperConfig={popperConfig}
    >
      {({ props }) => (
        <div {...props} className='hover-card-controller'>
          <HoverCardAccount accountId={accountId} ref={cardRef} />
        </div>
      )}
    </Overlay>
  );
};
