import macro from 'vtk.js/Sources/macro';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import dispatchEvent from '../../../helpers/dispatchEvent.js';
import EVENTS from '../../../events';

function vtkjsToolsMPRCrosshairManipulator(publicAPI, model) {
  // Set our className
  const manipulatorClassName = 'vtkjsToolsMPRCrosshairManipulator';

  model.classHierarchy.push(manipulatorClassName);

  // Notes:
  // - On mouse down / mouse drag => Just update the world position of the crosshairs tool.
  // - Emit an update image event.
  // - In crosshairs tool itself we should render on updateImage event.

  // re-render -> update crosshairs for API. => uses cached world position
  //

  // Pass apis and apiIndex down to each manipulator.
  // It still has to be possible to have multiple sets of synced apis.
  //
  // So... We need to:
  // - make all the viewports
  // - Then instantiate the tool (applications duty).
  // Note: This syncing will be a lot easier once we put everything in one render window anyway.

  //
  //

  publicAPI.onButtonDown = (interactor, renderer, position) => {
    if (!model.viewportData) {
      return;
    }

    dispatchEvent(eventWindow, EVENTS.IMAGE_RENDERED, {
      interactor,
      renderer,
      mosuePosition: { x: position.x, y: position.y },
      manipulatorClassName,
    });
  };

  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!model.viewportData) {
      return;
    }

    const eventWindow = model.viewportData.getEventWindow();

    dispatchEvent(eventWindow, EVENTS.IMAGE_RENDERED, {
      interactor,
      renderer,
      mosuePosition: { x: position.x, y: position.y },
      manipulatorClassName,
    });
  };

  function moveCrosshairs(position, renderer) {
    const { apis, apiIndex } = model;
    const api = apis[apiIndex];

    const dPos = vtkCoordinate.newInstance();
    dPos.setCoordinateSystemToDisplay();

    dPos.setValue(position.x, position.y, 0);
    let worldPos = dPos.getComputedWorldValue(renderer);

    const camera = renderer.getActiveCamera();
    const directionOfProjection = camera.getDirectionOfProjection();
    const halfSlabThickness = api.getSlabThickness() / 2;

    // Add half of the slab thickness to the world position, such that we select
    // The center of the slice.

    for (let i = 0; i < worldPos.length; i++) {
      worldPos[i] += halfSlabThickness * directionOfProjection[i];
    }

    api.svgWidgets.crosshairsWidget.moveCrosshairs(worldPos, apis, apiIndex);

    publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['viewportData']);

  // Object specific methods
  vtkjsToolsMPRCrosshairManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkjsToolsMPRCrosshairManipulator'
);

export default Object.assign({ newInstance, extend });
