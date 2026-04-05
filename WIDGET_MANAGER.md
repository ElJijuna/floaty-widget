# FloatyWidgetManager

El `FloatyWidgetManager` es un Context que te permite gestionar múltiples widgets `Floaty` de forma centralizada.

## Uso Básico

```tsx
import { FloatyWidgetManager, Floaty, useFloatyWidgetManager } from 'floaty-widget';

const App = () => {
  return (
    <FloatyWidgetManager>
      <YourComponent />
    </FloatyWidgetManager>
  );
};
```

## Dentro del Context

Para acceder al manager desde un componente:

```tsx
import { useFloatyWidgetManager } from 'floaty-widget';

const Component = () => {
  const manager = useFloatyWidgetManager();

  return (
    <div>
      <button onClick={() => manager.expandAll()}>Expand All</button>
      <button onClick={() => manager.collapseAll()}>Collapse All</button>
      <button onClick={() => manager.pinAll()}>Pin All</button>
      <button onClick={() => manager.unpinAll()}>Unpin All</button>

      <Floaty id="widget-1" title="Widget 1">Content 1</Floaty>
      <Floaty id="widget-2" title="Widget 2">Content 2</Floaty>
    </div>
  );
};
```

## API del Manager

### Métodos Globales

```tsx
// Expandir todos los widgets
manager.expandAll();

// Colapsar todos los widgets
manager.collapseAll();

// Fijar todos los widgets
manager.pinAll();

// Desfijar todos los widgets
manager.unpinAll();
```

### Métodos por Widget

```tsx
// Expandir un widget específico
manager.expandWidget('widget-1');

// Colapsar un widget específico
manager.collapseWidget('widget-1');

// Fijar un widget específico
manager.pinWidget('widget-1');

// Desfijar un widget específico
manager.unpinWidget('widget-1');

// Obtener estado de un widget
const widget = manager.getWidget('widget-1');
console.log(widget); // { id: 'widget-1', isCollapsed: false, isPinned: false }
```

## Ejemplo Completo

```tsx
import { FloatyWidgetManager, Floaty, useFloatyWidgetManager } from 'floaty-widget';

function ControlPanel() {
  const manager = useFloatyWidgetManager();

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 999 }}>
      <h3>Widget Controls</h3>
      <button onClick={() => manager.expandAll()}>📖 Expand All</button>
      <button onClick={() => manager.collapseAll()}>📕 Collapse All</button>
      <button onClick={() => manager.pinAll()}>📌 Pin All</button>
      <button onClick={() => manager.unpinAll()}>📍 Unpin All</button>

      <div>
        <p>Active Widgets: {manager.widgets.size}</p>
        {Array.from(manager.widgets.entries()).map(([id, widget]) => (
          <div key={id}>
            • {id}: {widget.isCollapsed ? '📕' : '📖'} {widget.isPinned ? '📌' : '📍'}
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <FloatyWidgetManager>
      <ControlPanel />

      <Floaty id="notifications" title="Notifications">
        <p>Notification content</p>
      </Floaty>

      <Floaty id="settings" title="Settings">
        <p>Settings content</p>
      </Floaty>

      <Floaty id="profile" title="Profile">
        <p>Profile content</p>
      </Floaty>
    </FloatyWidgetManager>
  );
}
```

## Notas Importantes

- **ID Required**: Cada `Floaty` debe tener un `id` único para ser gestionado por el manager
- **State Sync**: El estado se sincroniza automáticamente entre el widget y el manager
- **Opcional**: Puedes usar `Floaty` sin un ID y sin el manager - funcionará de forma independiente
- **Context Required**: `useFloatyWidgetManager` debe usarse dentro de `FloatyWidgetManager`

## TypeScript Types

```tsx
import type { FloatyWidgetManagerProps, FloatyWidgetState } from 'floaty-widget';

interface FloatyWidgetState {
  id: string;
  isCollapsed: boolean;
  isPinned: boolean;
}
```
