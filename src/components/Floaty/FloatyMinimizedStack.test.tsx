import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { FloatyWidgetManager } from '../../context/FloatyWidgetManager';
import { useFloatyWidgetManager } from '../../hooks/useFloatyWidgetManager';
import { Floaty } from './Floaty';
import { FloatyMinimizedStack } from './FloatyMinimizedStack';
import { FloatyViewport } from './FloatyViewport';

const Content = () => <button type="button">Inside preview</button>;
const Workspace = () => {
  const manager = useFloatyWidgetManager();
  const { open } = manager;
  useEffect(() => {
    open({ id: 'a', title: 'A', component: Content, props: {}, autoFocus: true });
    open({ id: 'b', title: 'B', component: Content, props: {} });
  }, [open]);
  return (
    <>
      <button type="button" onClick={() => manager.minimizeWidget('a')}>
        Minimize A
      </button>
      <button type="button" onClick={() => manager.minimizeWidget('fallback')}>
        Minimize fallback
      </button>
      <button type="button" onClick={() => manager.restoreWidget('a')}>
        Restore A externally
      </button>
      <button type="button" onClick={() => manager.close('a')}>
        Close A externally
      </button>
      <output>{manager.getWidget('a')?.isMinimized ? 'minimized' : 'restored'}</output>
      <Floaty id="fallback" title="Fallback">
        Standalone content
      </Floaty>
      <FloatyViewport />
      <FloatyMinimizedStack />
    </>
  );
};
const setup = () =>
  render(
    <FloatyWidgetManager>
      <Workspace />
    </FloatyWidgetManager>,
  );

describe('FloatyMinimizedStack', () => {
  it('filters minimized widgets and reacts to external restore and close', () => {
    setup();
    expect(screen.queryByRole('group', { name: 'Minimized windows' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Minimize A'));
    expect(screen.getByRole('button', { name: 'Restore: A' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore: B' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Restore A externally'));
    expect(screen.queryByRole('group', { name: 'Minimized windows' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Minimize A'));
    fireEvent.click(screen.getByText('Close A externally'));
    expect(screen.queryByRole('group', { name: 'Minimized windows' })).not.toBeInTheDocument();
  });

  it.each(['click', 'Enter', ' '])(
    'restores through %s and excludes preview controls',
    async (action) => {
      setup();
      fireEvent.click(screen.getByText('Minimize A'));
      const button = screen.getByRole('button', { name: 'Restore: A' });
      const preview = button.parentElement?.querySelector('.floaty-minimized-preview');
      expect(preview).toHaveAttribute('inert');
      expect(preview).toHaveAttribute('aria-hidden', 'true');
      if (action === 'click') {
        fireEvent.click(button);
      } else {
        button.focus();
        await userEvent.keyboard(action === 'Enter' ? '{Enter}' : ' ');
      }
      expect(screen.getByText('restored')).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Minimized windows' })).not.toBeInTheDocument();
    },
  );

  it('shows a title fallback without previewable content', () => {
    setup();
    fireEvent.click(screen.getByText('Minimize fallback'));
    expect(screen.getByRole('button', { name: 'Restore: fallback' })).toBeInTheDocument();
    expect(document.querySelector('.floaty-minimized-fallback')).toHaveTextContent('fallback');
  });
});
