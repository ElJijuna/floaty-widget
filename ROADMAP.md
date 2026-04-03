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

## Fase 3: Mejoras y Publicación
- [ ] Agregar estilos globales y temas
- [ ] Documentación completa
- [ ] Tests unitarios
- [ ] Build para producción
- [ ] Publicar en npm

## Características del Floaty:
- **Header Draggable**: Permite arrastrar el componente por la pantalla (instantáneo, sin laggers)
- **Expand/Collapse**: Botón con flecha SVG animada en lado derecho
- **Pin/Unpin**: Icono SVG que cambia estado y previene dragging
- **Children Support**: Acepta contenido flexible dentro
- **Animaciones**: Expand/collapse con spring easing, border-radius smooth

