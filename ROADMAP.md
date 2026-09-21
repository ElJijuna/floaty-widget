# Floaty Widget - Roadmap

## Fase 1: Setup Inicial ✓
- [x] Inicializar proyecto con React 19, Vite 5, Storybook 10
- [x] Configurar tree-shaking
- [x] Configurar estructura base del proyecto
- [x] Sin overrides innecesarios (Storybook 10 core integrado)

## Fase 2: Componente Floaty ✓
- [x] Crear componente Floaty con funcionalidad de draggable
- [x] Implementar Header componible
- [x] Implementar botón expandir/colapsar con animaciones
- [x] Implementar pin/unpin para deshabilitar dragging
- [x] Crear Storybook stories del componente
- [x] Configurar TypeScript con tipos exportables
- [x] Iconos SVG para Pin y Chevron
- [x] Animaciones suaves de expand/collapse

## Fase 3: Mejoras y Publicación ✓
- [x] Agregar estilos globales y temas
- [x] Documentación de UX, teclado, viewport y textos configurables
- [x] Tests unitarios de interacciones UX principales
- [x] Build para producción
- [x] Publicar en npm (v1.9.0, release automatizado con semantic-release)

## Fase 4: Gestión de múltiples ventanas
- [x] FloatyWidgetManager / FloatyProvider con store de widgets
- [x] Resize handles (incluyendo handle este) con persistencia de geometría
- [x] Arrange de ventanas: grid, columnas y filas
- [x] Controlled state management con manejo de estado externo
- [x] Taskbar y preview de widgets colapsados
- [x] Carga perezosa de contenido (loader/fallback)
- [x] Persistencia de layout por widget (posición, tamaño, pin, collapse, maximize, snap) via `persistenceKey`, incluyendo geometría post-arrange — ya cubierto por tests en `FloatyWidgetManager.test.tsx` y `Floaty.test.tsx`
- [ ] Awareness de multi-viewport / multi-monitor
- [ ] (Fuera de alcance por diseño) Restaurar automáticamente qué widgets estaban abiertos entre sesiones — el store mantiene referencias a componentes React no serializables; el consumidor decide qué reabrir

## Fase 5: Calidad y mantenimiento
- [x] Cubrir el handle imperativo (`moveTo`, `resizeTo`, `setGeometry`, `toggleMaximized`) sin tests (branches: 83.48% → 83.77%)
- [ ] Revisar branches restantes sin cubrir en FloatyWidgetManager.tsx (líneas 63,103,134,154,212,224-236,298-309,344,428,544,562) y windowGeometry.ts (getSnapZone, líneas 92,95,98)

## Características del Floaty:
- **Header Draggable**: Permite arrastrar el componente por la pantalla (instantáneo, sin laggers)
- **Expand/Collapse**: Botón con flecha SVG animada en lado derecho
- **Pin/Unpin**: Icono SVG que cambia estado y previene dragging
- **Children Support**: Acepta contenido flexible dentro
- **Animaciones**: Expand/collapse con spring easing, border-radius smooth
- **Accesibilidad**: Soporte de teclado para colapsar, mover y redimensionar
- **Responsive**: Reajuste automático al cambiar el viewport y controles touch más visibles
