import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import { Floaty } from './Floaty';
import type { FloatyHandle } from '../../context/FloatyWidgetManager';

describe('Floaty', () => {
  describe('rendering', () => {
    it('renders with default title and children', () => {
      render(<Floaty />);
      expect(screen.getByText('Floaty')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders custom title and children', () => {
      render(<Floaty title="My Widget">Hello World</Floaty>);
      expect(screen.getByText('My Widget')).toBeInTheDocument();
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('hides body when defaultCollapsed is true', () => {
      render(<Floaty defaultCollapsed>Child content</Floaty>);
      expect(screen.queryByText('Child content')).not.toBeInTheDocument();
    });

    it('returns null when defaultMinimized is true', () => {
      const { container } = render(<Floaty defaultMinimized />);
      expect(container.firstChild).toBeNull();
    });

    it('renders close button only when onClose is provided', () => {
      const { rerender } = render(<Floaty />);
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();

      rerender(<Floaty onClose={() => {}} />);
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('applies className to root element', () => {
      const { container } = render(<Floaty className="my-class" />);
      expect(container.firstChild).toHaveClass('my-class');
    });
  });

  describe('collapse / expand', () => {
    it('collapses on button click and hides body', () => {
      render(<Floaty>Child content</Floaty>);

      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));

      expect(screen.queryByText('Child content')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
    });

    it('expands again after collapsing', () => {
      render(<Floaty>Child content</Floaty>);

      fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
      fireEvent.click(screen.getByRole('button', { name: 'Expand' }));

      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('starts collapsed when defaultCollapsed is true', () => {
      render(<Floaty defaultCollapsed>Child content</Floaty>);
      expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
    });
  });

  describe('minimize', () => {
    it('hides widget on minimize click', () => {
      const { container } = render(<Floaty />);

      fireEvent.click(screen.getByRole('button', { name: 'Minimize' }));

      expect(container.firstChild).toBeNull();
    });
  });

  describe('pin / unpin', () => {
    it('toggles between pin and unpin labels', () => {
      render(<Floaty />);

      fireEvent.click(screen.getByRole('button', { name: 'Pin' }));
      expect(screen.getByRole('button', { name: 'Unpin' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Unpin' }));
      expect(screen.getByRole('button', { name: 'Pin' })).toBeInTheDocument();
    });

    it('adds pinned class when pinned', () => {
      const { container } = render(<Floaty defaultPinned />);
      expect(container.firstChild).toHaveClass('pinned');
    });
  });

  describe('callbacks', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<Floaty onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onFocus on pointer down on root element', () => {
      const onFocus = vi.fn();
      const { container } = render(<Floaty onFocus={onFocus} />);

      fireEvent.pointerDown(container.firstChild!);

      expect(onFocus).toHaveBeenCalled();
    });
  });

  describe('drag performance', () => {
    it('measures layout once when dragging and updates visually on release', () => {
      const { container } = render(<Floaty />);
      const root = container.firstElementChild as HTMLElement;
      const header = container.querySelector('.floaty-header') as HTMLElement;
      const getBoundingClientRect = vi
        .spyOn(root, 'getBoundingClientRect')
        .mockReturnValue({
          x: 100,
          y: 100,
          top: 100,
          right: 420,
          bottom: 260,
          left: 100,
          width: 320,
          height: 160,
          toJSON: () => {},
        } as DOMRect);

      header.setPointerCapture = vi.fn();

      const pointerTarget = globalThis as unknown as Window;

      fireEvent.pointerDown(header, { clientX: 100, clientY: 100, pointerId: 1 });
      fireEvent.pointerMove(pointerTarget, { clientX: 120, clientY: 125 });
      fireEvent.pointerMove(pointerTarget, { clientX: 130, clientY: 140 });
      fireEvent.pointerUp(pointerTarget);

      expect(getBoundingClientRect).toHaveBeenCalledOnce();
      expect(root).toHaveStyle({ transform: 'translate(130px, 140px)' });
    });
  });

  describe('custom labels', () => {
    it('uses custom labels for buttons', () => {
      render(
        <Floaty labels={{ collapse: 'Ocultar', expand: 'Mostrar', minimize: 'Minimizar' }} />
      );
      expect(screen.getByRole('button', { name: 'Ocultar' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Minimizar' })).toBeInTheDocument();
    });
  });

  describe('imperative handle', () => {
    it('exposes collapse and expand methods via ref', () => {
      const ref = createRef<FloatyHandle>();
      render(<Floaty ref={ref}>Child content</Floaty>);

      expect(screen.getByText('Child content')).toBeInTheDocument();

      act(() => ref.current?.collapse());
      expect(screen.queryByText('Child content')).not.toBeInTheDocument();

      act(() => ref.current?.expand());
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('exposes toggle method via ref', () => {
      const ref = createRef<FloatyHandle>();
      render(<Floaty ref={ref}>Child content</Floaty>);

      act(() => ref.current?.toggle());
      expect(screen.queryByText('Child content')).not.toBeInTheDocument();

      act(() => ref.current?.toggle());
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });
});
