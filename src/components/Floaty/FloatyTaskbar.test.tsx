import { act, fireEvent, render, screen } from '@testing-library/react';
import { type FC, useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { FloatyWidgetManager } from '../../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../../hooks/useFloatyWidgetManager';
import { FloatyTaskbar } from './FloatyTaskbar';
import { FloatyViewport } from './FloatyViewport';

const Content: FC = () => <div>Window content</div>;

const Workspace = () => {
  const manager = useFloatyWidgetManager();
  const { open } = manager;

  useEffect(() => {
    open({ id: 'window-a', title: 'Window A', component: Content, props: {} });
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => manager.minimizeWidget('window-a')}>
        Minimize externally
      </button>
      <FloatyViewport />
      <FloatyTaskbar />
    </>
  );
};

describe('FloatyTaskbar', () => {
  it('tracks, restores, focuses and closes managed windows', () => {
    render(
      <FloatyWidgetManager>
        <Workspace />
      </FloatyWidgetManager>,
    );

    expect(screen.getByRole('toolbar', { name: 'Open windows' })).toBeInTheDocument();
    const task = screen.getByRole('button', { name: 'Window A' });
    expect(task).toHaveAttribute('aria-pressed', 'true');

    act(() => fireEvent.click(screen.getByRole('button', { name: 'Minimize externally' })));
    expect(screen.queryByText('Window content')).not.toBeInTheDocument();

    fireEvent.click(task);
    expect(screen.getByText('Window content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close: Window A' }));
    expect(screen.queryByRole('toolbar', { name: 'Open windows' })).not.toBeInTheDocument();
  });
});
