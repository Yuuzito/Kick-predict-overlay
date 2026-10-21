# 🎮 Kick Prediction Overlay para OBS Studio

Overlay interactivo, moderno y de alto rendimiento diseñado para **OBS Studio**, **Streamlabs** o cualquier software de streaming. Detecta y muestra automáticamente las **predicciones de Kick en tiempo real**: título de la apuesta, opciones, porcentajes dinámicos, total de puntos apostados, multiplicadores y animación de celebración para el ganador.

---

## ✨ Características

- 🟢 **En Vivo con Kick**: Conecta con cualquier canal de Kick (`xqc`, `adinross`, `westcol`, etc.) y obtiene automáticamente los datos de la última predicción activa o finalizada.
- 📊 **Porcentajes y Puntos Dinámicos**:
  - Porcentaje en tiempo real de cada opción (Opción A vs Opción B).
  - Cantidad total de puntos en la bolsa (formateado: `16.0M pts`, `145K pts`).
  - Total de votos/apostadores y multiplicador estimado (`1.30x`, `4.34x`).
  - Barra de progreso bicolor con división fluida y animaciones CSS.
- 👑 **Anuncio y Celebración del Ganador**:
  - Detección automática del estado `RESOLVED`.
  - Corona dorada en la opción ganadora y oscurecimiento de la opción perdedora.
  - Banner oficial de victoria con trofeo.
  - **Lluvia de confeti** en Canvas a 60 FPS.
- ⏱️ **Temporizador de Votación**: Cuenta regresiva en tiempo real mientras la votación está abierta (`ACTIVE`), y cambia a `BLOQUEADO` (`LOCKED`) cuando se cierran las apuestas.
- 🎛️ **Panel Flotante de Control & Simulador de Stream**:
  - Barra superior de vista previa para probar con diferentes fondos de juego (Juego Oscuro, Claro, Transparencia Alpha).
  - Botones de prueba: Iniciar Demo, Simular Votos, Bloquear, Declarar Ganador, Cancelar predicción (con reembolso) y Auto-ocultar.
  - Selector de diseño (Compacto, Estándar, Horizontal, Minimal).
  - Generador automático de URL limpia (`?clean=1`) para pegar en OBS Studio.
- 🚫 **Gestión de Cancelaciones**: Si el streamer cancela la predicción, el overlay muestra de inmediato el estado en rojo (`CANCELADA - REEMBOLSADO`), atenúa las opciones y se auto-oculta tras unos segundos.
- 🪟 **Fondo 100% Transparente**: Diseñado con Glassmorphism oscuro y sombras de neón para integrarse perfectamente sobre tu juego o cámara.

---

## 🚀 Inicio Rápido & Enlaces Online

### Método 1: GitHub Pages Online (Sin instalar nada)
- **Vista Previa / Simulador:** [https://yuuzito.github.io/Kick-predict-overlay/](https://yuuzito.github.io/Kick-predict-overlay/)
- **Enlace directo para OBS Studio:**
  ```text
  https://yuuzito.github.io/Kick-predict-overlay/?channel=TU_CANAL&clean=1
  ```
  *(Reemplaza `TU_CANAL` por tu usuario de Kick).*

### Método 2: Servidor Local en tu PC
1. Haz doble clic en el archivo **`iniciar_servidor.bat`** (servidor local en puerto `8080`).
2. En tu navegador o en OBS abre: `http://localhost:8080/index.html?channel=TU_CANAL`

---

## 📺 Configuración en OBS Studio

1. Abre **OBS Studio**.
2. En tu escena, añade una nueva fuente: **`+` -> `Navegador` (Browser Source)**.
3. Asígnale un nombre (ej. `Kick Predicciones`).
4. Configuración recomendada:
   - **URL**: `https://yuuzito.github.io/Kick-predict-overlay/?channel=TU_CANAL&clean=1` *(o tu URL localhost)*
   - **Ancho (Width)**: `600` px *(o `850` px para Horizontal)*
   - **Alto (Height)**: `360` px *(o `200` px para Horizontal)*
   - **Frecuencia de cuadros personalizada (FPS)**: `60`
5. Haz clic en **Aceptar**. ¡Listo! El overlay flotará con transparencia total en tu directo.

---

## ⚙️ Parámetros de URL Disponibles

Puedes personalizar el comportamiento del overlay mediante parámetros en la URL:

| Parámetro | Valores | Ejemplo | Descripción |
|---|---|---|---|
| `channel` | Nombre del streamer | `?channel=xqc` | Canal de Kick del cual leer las predicciones (por defecto `xqc`). |
| `layout` | `compact`, `standard`, `horizontal`, `minimal` | `?layout=compact` | Diseño del overlay (Compacto por defecto, Estándar, Barra Horizontal o Minimalista). |
| `clean` | `1` o `0` | `?clean=1` | Modo limpio para OBS: elimina barra de vista previa, dock y activa transparencia total. |
| `autohide` | `1` o `0` | `?autohide=1` | Auto-oculta el widget cuando esté inactivo, resuelto o cancelado (activado por defecto). |
| `demo` | `1` o `0` | `?demo=1` | Inicia directamente en modo de demostración para pruebas visuales. |

**Ejemplo de URL completa para OBS:**
```text
http://localhost:8080/index.html?channel=mi_canal&clean=1&layout=compact
```

---

## 🛠️ Modo Demo / Pruebas

Para probar cómo se ve el overlay:
1. Abre `http://localhost:8080/index.html` en tu navegador.
2. Usa la barra superior de **Vista Previa** para cambiar el fondo simulado o alternar visibilidad.
3. Haz clic en el botón inferior derecho **`⚙️ Configuración OBS`** para abrir los controles:
   - **▶ Nueva Demo**: Crea una predicción de prueba con cuenta regresiva.
   - **⚡ Simular Votos**: Agrega votos aleatorios y actualiza porcentajes y multiplicadores al vuelo.
   - **🔒 Bloquear**: Cierra las votaciones.
   - **🏆 Gana Opción A / B**: Declara al ganador y dispara la lluvia de confeti.
   - **⏳ Ganar y Ocultar en 5s**: Declara al ganador y prueba la transición de auto-ocultamiento.
   - **🚫 Cancelar (Reembolso y Ocultar)**: Muestra el estado de cancelación en rojo y se auto-oculta.
   - **👻 Simular Inactivo**: Oculta el widget simulando que no hay predicción en curso.
   - **🔄 Reset**: Vuelve a escuchar el canal real configurado.
