import { act, render, screen } from '@testing-library/react';
import { createRef, type FC } from 'react';
import { describe, expect, it } from 'vitest';
import { FloatyWidgetManager } from '../../context/FloatyWidgetManager';
import type { FloatyWidgetManagerHandle } from '../../types';
import { FloatyPreview } from './FloatyPreview';

const PreviewContent: FC<{ label: string }> = ({ label }) => <span>{label}</span>;

describe('FloatyPreview', () => {
  it('renders its fallback when the widget is unavailable', () => {
    render(<FloatyPreview id="missing" fallback={<span>No preview</span>} />);

    expect(screen.getByText('No preview')).toBeInTheDocument();
  });

  it('renders a layout-scaled, non-interactive preview of an open widget', () => {
    const managerRef = createRef<FloatyWidgetManagerHandle>();
    const { container } = render(
      <FloatyWidgetManager ref={managerRef}>
        <FloatyPreview id="preview" scale={0.5} className="preview-frame" />
      </FloatyWidgetManager>,
    );

    act(() => {
      managerRef.current?.open({
        id: 'preview',
        component: PreviewContent,
        props: { label: 'Live preview' },
      });
    });

    expect(screen.getByText('Live preview')).toBeInTheDocument();
    expect(container.querySelector('.preview-frame > div')).toHaveStyle({
      zoom: '0.5',
      pointerEvents: 'none',
      userSelect: 'none',
    });
  });
});
