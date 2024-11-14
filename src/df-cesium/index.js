/* eslint-disable no-undef */
// Dfcesium - 地图工作台调用的类方法
import { ShapeList } from "./shape/index";
import { Task } from "./task/index";
import { getCoordinate, getPositionByGeographic } from "./utils/utils";
import { StateshotUndoRedo } from "./state-shot";
import * as tdtConfig from "./config/tdt-map-config";
import * as gaodeConfig from "./config/gaode-map-config";
import { Topo } from "./topo/index";
import { getIdGenerator } from "./utils/id-generator";
import { flatten, groupBy } from "lodash";
import { ShapeConfig } from "./config/shapeconfig";

export class DfcesiumApplication {
  constructor(age) {
    Cesium.Ion.defaultAccessToken = age.defaultAccessToken;
    this.mapType = age.mapType;
    const options = age.options;
    options.sceneMode = Cesium.SceneMode.SCENE2D
    if (this.mapType === "PRIVATEMAP" && !options.imageryProvider) return;

    if (this.mapType !== "PRIVATEMAP") {
      options.imageryProvider =
        this.mapType === "GAUDMAP"
          ? gaodeConfig.VecProvider
          : tdtConfig.VecProvider;
    }
    // eslint-disable-next-line constructor-super
    this.viewer = this.initDfcesium(age.container, options);
    if (this.mapType === "TDTMAP") {
      this.viewer.imageryLayers.addImageryProvider(tdtConfig.CiaProvider);
    }

    this.mapMoveDisabled();
    this.task = new Task(); //执行中的任务
    this.topo = new Topo();
    this.selectShapes = []; // 当前选中的设备
    this.mapRenderOver = false;
    this.mapRenderOverCallBack = age.mapRenderOverCallBack;
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    this.cameraHeightChange = age.cameraHeightChange;
    this.handlerCallBack = age.handlerCallBack; // 事件传递给业务层的回调
    this.showMousePoint = false; // 展示鼠标跟随点
    this.cameraHeight = 0;
    this.shapeCanMove = age.shapeCanMove || true; // 全局控制，设备是否可以拖动
    this.shapeMoveAndConnectLine = age.shapeMoveAndConnectLine || true; // 设备拖动的时候连接线是否跟随变动保持链接状态
    this.currentSelectShapeStartDeformation = false;
    this.currentDeformationSelectShape = null;
    this.mousetUp = true; // 鼠标抬起动作
    this.timeoutFun = null;
    this.moveShap = {
      state: false,
      shape: null,
      startPoint: null,
    };

    this.moveCopyShap = {
      state: false,
      shape: null,
      startPoint: null,
      copyShape: null,
    };

    if (this.handler) {
      this.initHandler();
    }
    this.shapeList = new ShapeList({ viewer: this.viewer });
    this.stateshotUndoRedo = new StateshotUndoRedo();
    this.mapLoad();
  }

  // 初始化地图
  initDfcesium(container, options) {
    const viewer = new Cesium.Viewer(container, options);

    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 2;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = 1000000;

    viewer._cesiumWidget._creditContainer.style.display = "none";
    viewer.scene.globe.maximumScreenSpaceError = 4 / 3;
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    // 设置分辨率改变清晰度
    // if (Cesium.FeatureDetection.supportsImageRenderingPixelated()) {
    //   viewer.resolutionScale = window.devicePixelRatio;
    // }
    // 开启抗锯齿
    // viewer.scene.fxaa = true;
    // viewer.scene.postProcessStages.fxaa.enabled = true;

    return viewer;
  }

  closeShapeMove() {
    this.shapeCanMove = false;
  }

  openShapeMove() {
    this.shapeCanMove = true;
  }

  openShapeMoveAndConnectLine() {
    this.shapeMoveAndConnectLine = true;
  }
  closeShapeMoveAndConnectLine() {
    this.shapeMoveAndConnectLine = false;
  }

  // 获取当前选中的设备
  getSelectShapes() {
    return this.selectShapes;
  }

  // 从选中列表中删除选中的某个设备
  // removeSelectShapeById(id) {
  //   const isSelectShape = this.selectShapes.find((item) => {
  //     return item.shapeId === id;
  //   });
  //   if (!isSelectShape) return;
  //   isSelectShape.cancelSelectCurrentEntity();
  // }

  // 清空选中的设备
  clearSelectShapes() {
    for (var i = 0; i < this.selectShapes.length; i++) {
      this.selectShapes[i].cancelSelectCurrentEntity();
    }
    this.selectShapes = [];
    this.handlerCallBack("CANCEL_SELECT_SHAPE", this.selectShapes);
  }

  // 清空指定的设备
  removeSelectShapeById(id) {
    if (!id) return;
    const list = this.selectShapes.concat();
    const findShape = list.find((item) => {
      return item.shapeId === id;
    });
    if (findShape) {
      findShape.cancelSelectCurrentEntity();
      this.selectShapes = list.filter((item) => {
        return item.shapeId !== id;
      });
      this.handlerCallBack("CANCEL_SELECT_SHAPE", this.selectShapes);
    }
  }

  // initShapeList
  initShapeList(shapes) {
    this.shapeList.initShapeList(shapes || []);
    this.pushSync();
  }

  setTopo(topo) {
    this.topo.setTopo(topo);
  }

  // 初始化监听事件
  initHandler() {
    const _this = this;
    // 鼠标左键按下事件
    this.handler.setInputAction(function (event) {
      if (!_this.mapRenderOver) return;
      _this.mousetUp = false;
      _this.timeoutFun = setTimeout(() => {
        if (!_this.mousetUp) {
          const pick = _this.getPick(event.position);
          const shape =
            pick && pick.id.id ? _this.getShapeById(pick.id.id) : null;

          const coordinate = getCoordinate(_this.viewer, event.position);

          // 如果选中设备且设备被选中，且设备是可变形的，则执行变形操作，禁止地图移动
          if (pick && _this.selectShapes && _this.selectShapes.length > 0) {
            const pickId = pick.id._id.split("_")[0];

            const isSelectShape = _this.selectShapes.find((item) => {
              return item.shapeId === pickId;
            });

            // 变形相关
            if (
              isSelectShape &&
              isSelectShape.isDeformation &&
              !isSelectShape.lockDeformation
            ) {
              _this.mapMoveDisabled();
              isSelectShape.shapeDeformationDraw("LEFT_DOWN", coordinate, pick);
              _this.currentSelectShapeStartDeformation = true;
              _this.currentDeformationSelectShape = isSelectShape;
            }
          }

          // 模型设备拖出子设备

          // 拖动相关 选中设备 设备不可变形或者设备变形被锁住
          if (shape && (!shape.isDeformation || shape.lockDeformation)) {
            console.log("按下设备即将拖动");
            //全局是否移动开关是打开状态
            // 设备本身也是可以拖动
            if (_this.shapeCanMove && shape.shapeCanMove && !shape.modalShape) {
              // 执行拖动代码
              _this.moveShap = {
                state: true,
                shape: shape,
                startPoint: [coordinate.longitude, coordinate.latitude],
              };
              _this.mapMoveDisabled();
            }
          }
          if (
            shape &&
            shape.modalShape &&
            (shape.modalShapeCopyNumbers === "innumerable" ||
              shape.modalShapeCopyNumbers > 0)
          ) {
            // 获取当前shape 已经复制出来的shape 有多少
            if (
              shape.modalShapeCopyNumbers === "innumerable" ||
              shape.modalCopyShapeType === "1"
            ) {
              console.log("按下模型设备即将复制");
              _this.moveCopyShap = {
                state: true,
                shape: shape,
                copyShape: null,
                startPoint: [coordinate.longitude, coordinate.latitude],
              };
              _this.mapMoveDisabled();
            } else {
              const childShapeList = _this.shapeList.getChildShapeById(
                shape.shapeId
              );
              if (childShapeList.length < shape.modalShapeCopyNumbers) {
                console.log("按下模型设备即将复制");
                _this.moveCopyShap = {
                  state: true,
                  shape: shape,
                  copyShape: null,
                  startPoint: [coordinate.longitude, coordinate.latitude],
                };
                _this.mapMoveDisabled();
              }
            }
          }
          _this.handlerCallBack("LEFT_DOWN", { e: event });
        }
      }, 200);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // 鼠标移动事件
    this.handler.setInputAction(function (event) {
      if (!_this.mapRenderOver) return;
      const position = getCoordinate(_this.viewer, event.endPosition);
      // 设置鼠标跟随点
      if (_this.showMousePoint) {
        _this.setMousePoint([position.longitude, position.latitude]);
      }
      // 如果在执行任务则执行任务
      if (_this.task && _this.task.task && _this.task.task.params.shape) {
        _this.task.task.params.shape.mouseMove(_this.task, {
          position: position,
          e: event,
        });
      } else if (_this.currentSelectShapeStartDeformation) {
        // 如果在设备变形过程中则执行设备变形
        _this.currentDeformationSelectShape.shapeDeformationDraw(
          "MOUSE_MOVE",
          position
        );
      } else if (_this.moveShap && _this.moveShap.state) {
        console.log("拖动-更新设备位置");
        _this.moveShap.shape.updateEntityPosition(_this.moveShap.startPoint, [
          position.longitude,
          position.latitude,
        ]);
        _this.moveShap.startPoint = [position.longitude, position.latitude];

        if (
          _this.shapeMoveAndConnectLine &&
          (_this.moveShap.shape.shapeType === "STATIC_BILLBOARD" ||
            _this.moveShap.shape.shapeType === "ACTIVE_BILLBOARD")
        ) {
          // 连接线设备更新连接点，保持链接关系不变
          // 遍历当前设备各个端点链接的设备
          // 如果设备是连线则更新连线设备的shapePosition
          // const list = _this.moveShap.shape.endpoints || [];
          const list =
            _this.topo.getConnectShapeByTopo(_this.moveShap.shape.shapeId) ||
            [];

          for (var i = 0; i < list.length; i++) {
            const itemConnectShape = _this.shapeList.getShapeById(
              list[i].shapeId
            );

            if (itemConnectShape.shapeType === "STATIC_LINE") {
              itemConnectShape.updateEndpointsPosition(list[i].terminalId, [
                position.longitude,
                position.latitude,
              ]);
            }
          }
        } else {
          // 更新topo
          _this.updateEndpoints("MOVE_SHAPE", _this.moveShap.shape);
        }
      } else if (_this.moveCopyShap && _this.moveCopyShap.state) {
        console.log("copy shape");
        const positionInfo = [position.longitude, position.latitude];
        // 判断是否存在临时创建设备
        // 判断下距离起始点的距离
        if (_this.moveCopyShap.copyShape) {
          // 变更位置
          _this.moveCopyShap.copyShape.updateEntityPosition(
            _this.moveCopyShap.startPoint,
            positionInfo
          );
          _this.moveCopyShap.startPoint = positionInfo;
        } else {
          const oldShape = _this.moveCopyShap.shape;
          // 创建设备存到_this.moveCopyShap 中
          const params = new ShapeConfig({
            ...oldShape.modalCopyShapeConfig,
            parentShape: oldShape,
            modalShape: false,
            shapePosition: positionInfo,
            shapeId: getIdGenerator(),
          });
          console.log("params", params);
          const newShape = _this.shapeList.createShape(
            oldShape.shapeType,
            params
          );
          _this.moveCopyShap.copyShape = newShape;
        }
      } else {
        _this.handlerCallBack("MOUSE_MOVE", { e: event });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 鼠标松开事件
    this.handler.setInputAction(function (event) {
      if (!_this.mapRenderOver) return;
      _this.mousetUp = true;
      clearTimeout(_this.timeoutFun);
      if (_this.currentSelectShapeStartDeformation) {
        _this.currentDeformationSelectShape.updateSelectCurrentShape();
        _this.currentSelectShapeStartDeformation = false;
        _this.currentDeformationSelectShape = null;
        _this.mapMoveEnabled();
      } else if (_this.moveShap && _this.moveShap.state) {
        const position = getCoordinate(_this.viewer, event.position);
        _this.handlerCallBack("LEFT_UP", {
          e: event,
          position: position,
          type: "MOVESHAPE",
          shape: _this.moveShap.shape,
        });
        _this.moveShap = null;
        _this.mapMoveEnabled();
      } else if (_this.moveCopyShap && _this.moveCopyShap.state) {
        const position = getCoordinate(_this.viewer, event.position);
        _this.handlerCallBack("LEFT_UP", {
          e: event,
          position: position,
          type: "COPYSHAPE",
          shape: _this.moveCopyShap.shape,
          copyShape: _this.moveCopyShap.copyShape,
        });

        _this.mapMoveEnabled();
        // 如果模型复制出来的设备大于模型可以复制出来的设备且可以覆盖的场景
        // 删除shapeList 中第一个找到的子设备
        if (
          _this.moveCopyShap.shape.modalShapeCopyNumbers !== "innumerable" &&
          _this.moveCopyShap.shape.modalCopyShapeType === "1"
        ) {
          const childShapeList = _this.shapeList
            .getChildShapeById(_this.moveCopyShap.shape.shapeId)
            .filter((el) => {
              return el.shapeId !== _this.moveCopyShap.copyShape.shapeId;
            });
          if (
            childShapeList.length >=
            _this.moveCopyShap.shape.modalShapeCopyNumbers
          ) {
            console.log("删除");
            _this.shapeList.removeShape(childShapeList[0].shapeId);
          }
        }
        _this.moveCopyShap = null;
      } else {
        _this.handlerCallBack("LEFT_UP", { e: event });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    // 鼠标左键点击
    this.handler.setInputAction(function (event) {
      if (!_this.mapRenderOver) return;
      const position = getCoordinate(_this.viewer, event.position);
      const pick = _this.getPick(event.position);
      console.log("pick", pick);
      if (pick) {
        const clickShape =
          pick.id.id === "MOUSE_POINT" ? null : _this.getShapeById(pick.id.id); // 点击的shape
        console.log("clickShape", clickShape);
        if (clickShape) {
          let currentSelectShapes = _this.selectShapes || [];
          const isInclude = currentSelectShapes.find((item) => {
            return item.shapeId === clickShape.shapeId;
          });

          if (!isInclude) {
            if (!_this.task || !_this.task.task) {
              _this.clearSelectShapes();
              currentSelectShapes = _this.selectShapes;
            }
            currentSelectShapes.push(clickShape);
            clickShape.selectCurrentEntity(); // 选中设备
            _this.selectShapes = currentSelectShapes; // 当前设备为选中设备
          }
          _this.handlerCallBack("SELECT_SHAPE", {
            selectShapes: _this.selectShapes,
            position: position,
          });
        }
      } else {
        _this.clearSelectShapes();
      }

      if (_this.task && _this.task.task && _this.task.task.params.shape) {
        _this.task.task.params.shape.letfClick(_this.task, {
          position: position,
          e: event,
        });
      } else {
        _this.handlerCallBack("LEFT_CLICK", { e: event, position: position });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标双击事件
    this.handler.setInputAction(function (event) {
      if (!_this.mapRenderOver) return;

      const position = getCoordinate(_this.viewer, event.position);
      if (_this.task && _this.task.task && _this.task.task.params.shape) {
        _this.task.task.params.shape.letfDoubleClick(_this.task, {
          position: position,
          e: event,
        });
      } else {
        _this.handlerCallBack("LEFT_DOUBLE_CLICK", { e: event });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    _this.viewer.camera._changed.addEventListener(function () {
      const position = _this.viewer.camera.positionCartographic; //经纬度单位为弧度，高程单位为米.
      const height = position.height;
      _this.cameraHeight = height;
      _this.cameraHeightChange(height);
    });
  }

  // 无感定位
  setPositionViewer(local) {
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        local.longitude,
        local.latitude,
        local.height
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0), // east, default value is 0.0 (north)
        pitch: Cesium.Math.toRadians(-90), // default value (looking down)
        roll: 0.0, // default value
      },
    });

    this.cameraHeight = local.height;
  }

  // 飞行定位
  setPositionByFly(local) {
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        local.longitude,
        local.latitude,
        local.height
      ),
    });
  }
  // 创建设备
  createShape(key, params) {
    const shape = this.shapeList.createShape(key, params);
    if (key.includes("ACTIVE_")) {
      this.task.createTask({
        key: `ADD_${key}`,
        params: {
          shape: shape,
          shapePosition: [],
        },
      });
    }

    return shape;
  }

  // 删除shape-只更新视图
  shapeDeleteDraw(id, shape) {
    this.viewer.entities.removeById(id || this.id);
    if (shape) this.updateEndpoints("REMOVE_SHAPE", shape); // 更新topo
  }

  getShapeById(id) {
    return this.shapeList.getShapeById(id);
  }

  // 删除shape
  removeShape(id) {
    const shape = this.getShapeById(id);
    this.shapeList.removeShape(id);
    if (shape) this.updateEndpoints("REMOVE_SHAPE", shape); // 更新topo
    this.pushSync();
  }

  clearAllShapes() {
    this.shapeList.clearAllShapes();
    this.topo.removeTopo();
  }

  getAllShapes() {
    return this.shapeList.getAllShapes();
  }

  // 获取鼠标点击实体
  getPick(position) {
    const pick = this.viewer.scene.pick(position);
    if (pick && pick.id) return pick;
    return null;
  }

  // 创建鼠标跟随点
  setMousePoint(currentMousePoint) {
    if (this.mousePointEntities) {
      this.mousePointEntities.position = new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(
          currentMousePoint[0],
          currentMousePoint[1]
        );
      }, false);
    } else {
      // 新增
      this.mousePointEntities = this.viewer.entities.add({
        name: `鼠标点`,
        position: Cesium.Cartesian3.fromDegrees(
          currentMousePoint[0],
          currentMousePoint[1]
        ),
        id: `MOUSE_POINT`,
        point: {
          color: Cesium.Color.fromCssColorString("#1592E6").withAlpha(1),
          pixelSize: 10,
          show: true,
        },
      });
    }
  }

  // 展示鼠标跟随点
  openMousePoint() {
    this.showMousePoint = true;
  }

  // 删除鼠标跟随点
  delMousePoint() {
    this.showMousePoint = false;
    this.mousePointEntities = null;
    this.shapeDeleteDraw(`MOUSE_POINT`);
  }

  // 地图切片加载监听
  mapLoad() {
    const _this = this;
    const helper = new Cesium.EventHelper();
    helper.add(this.viewer.scene.globe.tileLoadProgressEvent, function (event) {
      console.log("event", event);
      if (event == 0) {
        console.log("这个是加载最后一个矢量切片的回调");
        _this.mapMoveEnabled();
        _this.mapRenderOver = true;
        _this.mapRenderOverCallBack(_this.mapRenderOver);
      }
    });
  }

  // 获取多边形区域内设备
  getPolyGonIncludeShapes(id) {
    return this.shapeList.getCuttingShapes(id);
  }

  // 添加暂存区
  pushSync() {
    this.stateshotUndoRedo.pushSync({ shapeList: this.shapeList.shapeList });
  }
  // 撤销
  undoOperate() {
    const currentShapeList = this.shapeList.shapeList.concat(); // 当前视图shapeList

    const undoShapeParams = this.stateshotUndoRedo.undoState(); // 撤销后的shapeList
    if (!undoShapeParams) return;
    const undoShapeList = undoShapeParams.shapeList; // 撤销后的shapeList

    this.shapeList.setShapeList(undoShapeList);
    const diffShapeParams = this.stateshotUndoRedo.getTwoStateDifference(
      currentShapeList,
      undoShapeList
    );

    if (diffShapeParams.type === "ADD") {
      const itemShape = diffShapeParams.shapes[0];
      this.shapeList.createShape(itemShape.shapeType, itemShape, true);
    }
    if (diffShapeParams.type === "REMOVE") {
      this.shapeDeleteDraw(
        diffShapeParams.shapes[0].shapeId,
        diffShapeParams.shapes[0]
      );
    }
  }

  // 还原
  redoOperate() {
    const currentShapeList = this.shapeList.shapeList.concat(); // 当前视图shapeList
    const redoShapeParams = this.stateshotUndoRedo.redoState(); // 撤销后的shapeList
    if (!redoShapeParams) return;
    const redoShapeList = redoShapeParams.shapeList; // 撤销后的shapeList
    this.shapeList.setShapeList(redoShapeList);
    const diffShapeParams = this.stateshotUndoRedo.getTwoStateDifference(
      currentShapeList,
      redoShapeList
    );

    if (diffShapeParams.type === "ADD") {
      const itemShape = diffShapeParams.shapes[0];
      this.shapeList.createShape(itemShape.shapeType, itemShape, true);
    }
    if (diffShapeParams.type === "REMOVE") {
      this.shapeDeleteDraw(
        diffShapeParams.shapes[0].shapeId,
        diffShapeParams.shapes[0]
      );
    }
  }

  // 地图移动控制-不动
  mapMoveDisabled() {
    const _this = this;
    _this.viewer.scene.screenSpaceCameraController.enableRotate = false; // 将相机锁定，不然后续移动实体时相机也会动
    _this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
    _this.viewer.scene.screenSpaceCameraController.enableZoom = false;
    _this.viewer.scene.screenSpaceCameraController.enableTilt = false; // 如果为真，则允许用户倾斜相机。如果为假，相机将锁定到当前标题。这个标志只适用于3D和哥伦布视图。
  }
  // 地图移动控制-可以动
  mapMoveEnabled() {
    const _this = this;
    _this.viewer.scene.screenSpaceCameraController.enableRotate = true; // 将相机锁定，不然后续移动实体时相机也会动
    _this.viewer.scene.screenSpaceCameraController.enableTranslate = true;
    _this.viewer.scene.screenSpaceCameraController.enableZoom = true;
    _this.viewer.scene.screenSpaceCameraController.enableTilt = true; // 如果为真，则允许用户倾斜相机。如果为假，相机将锁定到当前标题。这个标志只适用于3D和哥伦布视图。
  }

  // 切换矢量地图
  switchVecImageryLayer() {
    const layers = this.viewer.imageryLayers.get(0);
    const layers1 = this.viewer.imageryLayers.get(1);
    const layers2 = this.viewer.imageryLayers.get(2);
    layers.show = true;
    if (layers1) {
      layers1.show = false;
    }
    if (layers2) {
      layers2.show = false;
    }
  }
  // 切换影像地图
  switchImgImageryLayer() {
    const oldLayers = this.viewer.imageryLayers.get(0);
    const layers = this.viewer.imageryLayers.get(1);
    const layersSign = this.viewer.imageryLayers.get(2);
    if (layers) {
      layers.show = true;
      if (layersSign) {
        layersSign.show = true;
      }
      oldLayers.show = false;
    } else {
      if (this.mapType === "GAUDMAP") {
        oldLayers.show = false;
        this.viewer.imageryLayers.addImageryProvider(
          gaodeConfig.ImgProviderNoSign
        );
        this.viewer.imageryLayers.addImageryProvider(
          gaodeConfig.ImgProviderSign
        );
      }
    }
  }

  // 获取屏幕中心点屏幕坐标
  getViewScreenCenterPosition() {
    const clientWidthHalf = this.viewer.canvas.clientWidth / 2;
    const clientHeightHalf = this.viewer.canvas.clientHeight / 2;
    const position = {
      x: clientWidthHalf,
      y: clientHeightHalf,
    };

    const coordinate = getCoordinate(this.viewer, position);
    return coordinate;
  }

  // 批量创建连线
  // shapes:[[shape1,shape2],[shape1,shape2]],
  createConnectLines(shapes, lineConfig, callback) {
    const lineShapes = [];
    for (var i = 0; i < shapes.length; i++) {
      const startShape = shapes[i][0];
      const endshape = shapes[i][1];
      const startShapeDirection = startShape.connectShapeDirection || "CENTER";
      const endshapeDirection = endshape.connectShapeDirection || "CENTER";
      const itemShape = this.createConnectLine(
        lineConfig,
        shapes[i][0],
        shapes[i][1],
        startShapeDirection,
        endshapeDirection
      );
      lineShapes.push(itemShape);
    }

    callback(lineShapes);
  }

  // 创建连接线
  createConnectLine(
    lineConfig,
    startShape,
    endshape,
    startShapeDirection,
    endshapeDirection
  ) {
    if (startShape && endshape) {
      const shapePosition = [];
      const endpointItem1 = startShape.endpoints.find((item) => {
        return item.position.direction === (startShapeDirection || "CENTER");
      });

      if (!endpointItem1) return;
      shapePosition.push([
        endpointItem1.position.longitude,
        endpointItem1.position.latitude,
      ]);
      const endpointItem2 = endshape.endpoints.find((item) => {
        return item.position.direction === (endshapeDirection || "CENTER");
      });

      if (!endpointItem2) return;
      shapePosition.push([
        endpointItem2.position.longitude,
        endpointItem2.position.latitude,
      ]);
      lineConfig.shapePosition = shapePosition;
      const position0 = getPositionByGeographic(this.viewer, shapePosition[0]);
      position0.direction = "LEFT";
      const position1 = getPositionByGeographic(this.viewer, shapePosition[1]);
      position1.direction = "RIGHT";

      const endpoints = [
        {
          endpointId: getIdGenerator(), // 端点ID
          position: position0,
        },
        {
          endpointId: getIdGenerator(), // 端点ID
          position: position1,
        },
      ];
      lineConfig.endpoints = endpoints;
      lineConfig.shapeType = "STATIC_LINE";

      const lineShape = this.createShape("STATIC_LINE", lineConfig);

      // 更新topo

      this.updateEndpoints("ADD_SHAPE", [
        [
          {
            shape: startShape,
            terminalId: endpointItem1.endpointId,
          },
          {
            shape: lineShape,
            terminalId: endpoints[0].endpointId,
          },
        ],
        [
          {
            shape: endshape,
            terminalId: endpointItem2.endpointId,
          },
          {
            shape: lineShape,
            terminalId: endpoints[1].endpointId,
          },
        ],
      ]);
      return lineShape;
    } else {
      const lineShape = this.createShape("STATIC_LINE", lineConfig);
      return lineShape;
    }
  }

  // 获取最新的tpoo
  getTopo() {
    return this.topo.getTopo();
  }

  getItemTopo(list, terminalId, psrId) {
    const result = list.find((item) => {
      return item.terminalId === terminalId && item.shape.shapeId === psrId;
    });
    return result;
  }

  // 更新topo
  updateEndpoints(type, correlationShapes) {
    const topo = this.getTopo();
    if (type === "ADD_SHAPE") {
      for (var i = 0; i < correlationShapes.length; i++) {
        const itemTerminal = correlationShapes[i];

        const isIncludeTopo = topo.find((item) => {
          return this.getItemTopo(itemTerminal, item.terminalId, item.psrId);
        });

        const cnodeId = getIdGenerator();
        itemTerminal.forEach((element) => {
          element.cnodeId = isIncludeTopo ? isIncludeTopo.cnodeId : cnodeId;
          element.type = type;
        });
      }

      this.topo.updateTopo(flatten(correlationShapes));
    }
    if (type === "MOVE_SHAPE" || type === "REMOVE_SHAPE") {
      this.topo.updateTopo([{ shape: correlationShapes, type: type }]);
    }
  }

  // shapes 非连线设备列表
  // 根据topo关系 获取所有的连接线设备
  // key 连接线的key
  getLineShapeList(shapes, topo, psrType) {
    const lineShapeList = [];
    // 1.从topo 中找出所有的连接线设备
    const list = topo.filter((item) => {
      return item.psrType === psrType;
    });
    // 2.根据设备id 组建设备和端点的对应信息
    const lineShapesObj = groupBy(list, "psrId");
    for (const key in lineShapesObj) {
      if (Object.hasOwnProperty.call(lineShapesObj, key)) {
        const element = lineShapesObj[key];

        const endpoints = this.getLineEndpoint(shapes, topo, element, psrType);
        if (element.length > 1) {
          lineShapeList.push({
            shapeId: key,
            psrType: psrType,
            endpoints: endpoints,
            shapePosition: this.getPositionByEndpoints(endpoints),
          });
        }
      }
    }

    return lineShapeList;
  }

  // 获取某个设备某个端点的位置信息
  // list 非连接线设备列表
  getLineEndpoint(list, topo, element, psrType) {
    const endpoints = [];
    for (var i = 0; i < element.length; i++) {
      const cnodeId = element[i].cnodeId;
      const connectShapeTopo = topo.find((item) => {
        return (
          item.cnodeId === cnodeId &&
          item.psrId !== element[i].psrId &&
          item.psrType !== psrType
        );
      });

      if (connectShapeTopo) {
        const connectShape = list.find((item) => {
          return item.id === connectShapeTopo.psrId;
        });

        const shapeEndpoints = connectShape.endpoints;
        const result = shapeEndpoints.find((item) => {
          return item.endpointId === connectShapeTopo.terminalId;
        });
        endpoints.push({
          endpointId: element[i].terminalId,
          position: {
            ...result.position,
            direction: i === 0 ? "LEFT" : "RIGHT",
          },
        });
      }
    }
    return endpoints;
  }

  // 根据端点Endpoints获取坐标信息
  getPositionByEndpoints(endpoints) {
    return endpoints.map((item) => {
      return [item.position.longitude, item.position.latitude];
    });
  }

  // 根据设备ID查找该设备链接的设备
  getConnectShapeByTopo(shapeId) {
    return this.topo.getConnectShapeByTopo(shapeId);
  }
}
