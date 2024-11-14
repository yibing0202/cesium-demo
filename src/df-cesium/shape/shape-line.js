/* eslint-disable no-undef */
// 线段shape
import { ShapeBase } from "./shapeBase.js";
import * as turf from "@turf/turf";
import {
  getCoordinateByCartesian,
  getCesiumPositions,
  getShapeCenter,
  getMoveInfoByRefer,
  getMovePoint,
} from "../utils/utils";

export class EntitiesLineOpation extends ShapeBase {
  constructor(arg) {
    super(arg);
    this.currentEntity = null;
    this.addPointEntitys = []; // 编辑点
    this.editIndex = null;
    this.temporaryPoints = []; // 临时点
    this.isMoveEd = false;
    this.movePointPosition = this.shapePosition;
    this.endpointDirections = ["LEFT", "RIGHT"];
  }

  // 新增线段实体
  shapeAddDraw() {
    const _this = this;
    const shapePosition = this.shapePosition;

    if (!shapePosition || shapePosition.length < 1) return;
    const positions = Array.isArray(shapePosition[0])
      ? getCesiumPositions(shapePosition)
      : shapePosition;
    this.currentEntity = this.viewer.entities.add({
      id: this.shapeId,
      name: this.shapeName,
      polyline: {
        positions: positions,
        material: Cesium.Color.fromCssColorString(_this.shapeColor),
        width: this.shapeHeight,
        show: true,
        zIndex: 30,
      },
    });

    if (
      this.currentEntity &&
      !this.isDeformation &&
      this.endpoints.length < 1
    ) {
      this.createEndpoints((direction) => this.getEndpointPosition(direction));
    }
  }

  // 更新endpoints 中的位置信息
  updateEndpointsByPosition() {
    const endpoints = this.endpoints.concat();
    if (endpoints && endpoints.length > 0) {
      for (var i = 0; i < endpoints.length; i++) {
        endpoints[i].position = this.getEndpointPosition(
          endpoints[i].position.direction
        );
      }
    }
    this.updateSelfEndpoints(endpoints);
  }

  // 当前设备选中
  selectCurrentEntity() {
    if (this.selectState) return;
    this.currentEntity.polyline.material = Cesium.Color.fromCssColorString(
      this.selectColor
    ); // 变颜色
    if (this.isDeformation && !this.lockDeformation) {
      this.shapeAddPoint(); // 添加编辑点
    }
    this.updateSelectState(true);
  }

  // 更新线段实体位置
  updatePolineEntityPosition(distance, bearing, options) {
    const shapePointList = this.shapePosition.concat();
    const shapeNewPointList = [];
    for (var i = 0; i < shapePointList.length; i++) {
      const point = turf.point(shapePointList[i]);
      const destination = turf.destination(point, distance, bearing, options);
      shapeNewPointList.push(destination.geometry.coordinates);
    }

    this.updateShapePosition(shapeNewPointList);
    this.movePointPosition = shapeNewPointList;
    this.updateEndpointsByPosition();
    const positions = getCesiumPositions(shapeNewPointList);

    this.currentEntity.polyline.positions = new Cesium.CallbackProperty(() => {
      return positions;
    }, false);
  }

  // 更新编辑点位置
  updatePointEntityPosition(info) {
    const { distance, bearing, options } = info;
    const addPointEntitys = this.addPointEntitys;
    for (var i = 0; i < addPointEntitys.length; i++) {
      const value = addPointEntitys[i].position.getValue();
      const position = getCoordinateByCartesian(this.viewer, value);
      const point = turf.point([position.longitude, position.latitude]);
      const destination = turf.destination(point, distance, bearing, options);
      const destinationPosition = destination.geometry.coordinates;
      addPointEntitys[i].position = new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(
          destinationPosition[0],
          destinationPosition[1]
        );
      }, false);
    }
  }

  // 更新图形位置  referPosition参考坐标  position：移动后位置坐标
  updateEntityPosition(referPosition, position) {
    // 指定参考点则按照参考点移动,不指定则按照设备中心点移动位置
    const center = referPosition || getShapeCenter(this.shapePosition);
    const info = getMoveInfoByRefer(center, position);
    this.updatePointEntityPosition(info);
    const shapePointList = this.shapePosition.concat();
    const shapeNewPointList = [];
    for (var i = 0; i < shapePointList.length; i++) {
      shapeNewPointList.push(getMovePoint(shapePointList[i], info));
    }

    this.updateShapePosition(shapeNewPointList);
    this.updateEndpointsByPosition();
    const positions = getCesiumPositions(shapeNewPointList);
    this.currentEntity.polyline.positions = new Cesium.CallbackProperty(() => {
      return positions;
    }, false);
  }

  // 取消选中当前shape
  cancelSelectCurrentEntity() {
    this.editIndex = 0; // 索引归0
    this.delAddLinPont();
    this.removeAddEntitys(); // 删除新增实体
    this.currentEntity.polyline.material = Cesium.Color.fromCssColorString(
      this.shapeColor
    ).withAlpha(1);
    this.updateSelectState(false);
  }

  // 添加编辑点
  shapeAddPoint() {
    const pointPosition = this.shapePosition.concat();
    const addPointEntitys = this.addPointEntitys.concat();

    for (var i = 0; i < pointPosition.length; i++) {
      const currentPoint = pointPosition[i];
      addPointEntitys.push(
        this.viewer.entities.add({
          name: `编辑点${i}`,
          position: new Cesium.CallbackProperty(() => {
            return Cesium.Cartesian3.fromDegrees(
              currentPoint[0],
              currentPoint[1]
            );
          }, false),

          id: `${this.shapeId}_point_${i}`,
          description: i, // 编辑点对应pointPosition 的索引
          point: {
            color: Cesium.Color.fromCssColorString(this.selectColor),
            pixelSize: 10,
            show: true,
          },
        })
      );
    }

    this.addPointEntitys = addPointEntitys;
  }

  // shape 变形
  shapeDeformationDraw(type, point, pick) {
    if (this.lockDeformation) return;
    let points = this.shapePosition.concat();
    const pointArr = [point.longitude, point.latitude]; // 当前点经纬度坐标
    //  鼠标按下
    if (type === "LEFT_DOWN") {
      // 如果选中的是顶点
      if (pick && pick.id.id.includes("_point_")) {
        console.log("按下的是顶点");
        const editIndex = pick.id._description._value;
        this.editIndex = editIndex;
        this.editIndexType = "_point_";
      } else {
        // 选中的是线段
        // 计算点在线段图形的哪一条边上
        const editIndex = this.getClickIndex(point);
        points.splice(editIndex + 1, 0, [point.longitude, point.latitude]);
        this.editIndex = editIndex;
        this.editIndexType = "_line_";
        // 添加临时点
        this.addLinPont(point);
      }

      this.movePointPosition = points;
    }

    // 鼠标移动
    if (type === "MOUSE_MOVE") {
      // 鼠标移动，替换添加的点
      const editIndex = this.editIndex;
      this.isMoveEd = true;
      // 如果选中的是线段
      if (this.editIndexType === "_line_") {
        const pointsList = this.movePointPosition.concat();
        pointsList.splice(editIndex + 1, 1, pointArr);
        points = pointsList;
        const positions = getCesiumPositions(points);
        this.currentEntity.polyline.positions = new Cesium.CallbackProperty(
          () => {
            return positions;
          },
          false
        );

        // 临时点变形
        for (var i = 0; i < this.temporaryPoints.length; i++) {
          const itemTemporaryPoint = this.temporaryPoints[i];
          itemTemporaryPoint.position = new Cesium.CallbackProperty(() => {
            return Cesium.Cartesian3.fromDegrees(pointArr[0], pointArr[1]);
          }, false);
        }
      }

      // 如果选中的是编辑点
      if (this.editIndexType === "_point_") {
        const pointsList = this.movePointPosition.concat();
        pointsList.splice(editIndex, 1, pointArr);
        points = pointsList;
        const positions = getCesiumPositions(points);
        this.currentEntity.polyline.positions = new Cesium.CallbackProperty(
          () => {
            return positions;
          },
          false
        );

        // 找到点击的编辑点变形
        const currentSelectAddPointEntity = this.addPointEntitys[editIndex]; // 点击的覆盖点
        currentSelectAddPointEntity.position = new Cesium.CallbackProperty(
          () => {
            return Cesium.Cartesian3.fromDegrees(pointArr[0], pointArr[1]);
          },
          false
        );
      }
      this.movePointPosition = points;
    }
  }

  // 当前图形添加单个临时点
  addLinPont(point) {
    const temporaryPoints = this.temporaryPoints.concat();
    temporaryPoints.push(
      this.viewer.entities.add({
        name: `临时点0`,
        position: Cesium.Cartesian3.fromDegrees(
          point.longitude,
          point.latitude
        ),
        id: `${this.id}_linpoint_0`,
        point: {
          color: Cesium.Color.fromCssColorString(this.selectColor),
          pixelSize: 10,
          show: true,
        },
      })
    );
    this.temporaryPoints = temporaryPoints;
  }

  // 获取点击的点在线段图形的哪一条边上
  getClickIndex(point) {
    const points = this.movePointPosition.concat();

    if (points.length == 2) return 0;

    const pt = turf.point([point.longitude, point.latitude]);

    // let clickIndex = null

    const distanceArr = [];

    for (var i = 0; i < points.length; i++) {
      if (i < points.length - 1) {
        const line = turf.lineString([points[i], points[i + 1]]);
        const distance = turf.pointToLineDistance(pt, line, {
          units: "kilometers",
        });

        distanceArr.push({
          length: distance,
          index: i,
        });
      }
    }

    distanceArr.sort((a, b) => {
      return a.length - b.length;
    });

    return distanceArr[0].index;
  }

  // 删除当前shape
  shapeDeleteDraw() {
    this.deleteEntitie();
    this.delAddLinPont();
    this.removeAddEntitys();
  }
  // 删除新增的临时点
  delAddLinPont() {
    const temporaryPoints = this.temporaryPoints.concat();
    for (var i = 0; i < temporaryPoints.length; i++) {
      this.deleteEntitie(temporaryPoints[i].id);
    }
    this.temporaryPoints = [];
  }

  // 删除新增的编辑点
  removeAddEntitys() {
    const addEntitys = this.addPointEntitys;
    if (!addEntitys || addEntitys.length < 1) return;
    for (var i = 0; i < addEntitys.length; i++) {
      this.deleteEntitie(addEntitys[i].id);
    }
    this.addPointEntitys = [];
  }

  //变形中拖动结束鼠标松开-重新生成选中的当前shape
  updateSelectCurrentShape() {
    // 需要判断鼠标松开位置距离鼠标按下位置之间的距离，计算下鼠移动的距离
    const isMoveEd = this.isMoveEd; // 后续可以更加严谨点再加个移动距离条件

    if (isMoveEd) {
      this.shapePosition = this.movePointPosition;
    } else {
      this.movePointPosition = this.shapePosition;
    }
    this.isMoveEd = false;
    // 多边形实体上面覆盖的实体 重新生成覆盖原来的

    // 根据最新pointPosition 生成新的多边形
    const pointPosition = this.shapePosition.concat();
    const positions = getCesiumPositions(pointPosition);
    this.currentEntity.polyline.positions = new Cesium.CallbackProperty(() => {
      return positions;
    }, false);
    this.cancelSelectCurrentEntity();
    this.selectCurrentEntity();
  }

  // 绘制设备时候重新合成shape
  updateLineShapePosition(params) {
    this.updateShapePosition(params);
    this.movePointPosition = params;
    this.updateEndpointsByPosition();
    if (!this.currentEntity) {
      this.shapeAddDraw();
    } else {
      const pointPosition = this.shapePosition.concat();
      const positions = getCesiumPositions(pointPosition);
      this.currentEntity.polyline.positions = new Cesium.CallbackProperty(
        () => {
          return positions;
        },
        false
      );
    }
  }

  // 鼠标左键按下
  mouseLeftDown() {}

  // 鼠标移动
  mouseMove(task, params) {
    if (task && task.task.key === "ADD_ACTIVE_LINE") {
      const { position } = params;

      const shapePosition = this.shapePosition
        ? this.shapePosition.concat()
        : [];
      const point = [position.longitude, position.latitude]; // 鼠标点击点
      shapePosition.splice(-1, 1, point); // 替换最后一个点
      this.updateLineShapePosition(shapePosition);
    }
  }

  // 鼠标左键抬起
  mouseLeftUp() {}

  // 鼠标点击
  letfClick(task, params) {
    if (task && task.task.key === "ADD_ACTIVE_LINE") {
      const { position } = params;
      const shapePosition = this.shapePosition
        ? this.shapePosition.concat()
        : [];
      const point = [position.longitude, position.latitude]; // 鼠标点击点
      shapePosition.splice(-1, 0, point); // 最后一位数据前面插入一个点
      this.updateLineShapePosition(shapePosition);
    }
  }

  letfDoubleClick(task, params) {
    if (task && task.task.key === "ADD_ACTIVE_LINE") {
      const { position } = params;
      const shapePosition = this.shapePosition
        ? this.shapePosition.concat()
        : [];
      const point = [position.longitude, position.latitude]; // 鼠标点击点
      shapePosition.splice(-1, 1, point);
      this.updateLineShapePosition(shapePosition);
      task.removeTask();
      this.createShapeCallBack(this);
    }
  }

  // params:经纬度
  // direction 位置
  getEndpointPosition(direction) {
    // 经纬度转屏幕坐标
    const params =
      direction === "LEFT" ? this.shapePosition[0] : this.shapePosition[1];

    const pick = Cesium.Cartesian3.fromDegrees(params[0], params[1], 0);
    const position = new Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      this.viewer.scene,
      pick
    );
    position.longitude = params[0];
    position.latitude = params[1];
    position.direction = direction;

    return position;
  }

  // 更新线其中一个端点的position
  updateEndpointsPosition(endpointId, position) {
    const endpoints = this.endpoints;
    const result = endpoints.find((item) => {
      return item.endpointId === endpointId;
    });

    if (result) {
      const direction = result.position.direction;
      let index = 0;
      if (direction === "RIGHT") {
        index = 1;
      }

      const pointPosition = this.shapePosition.concat();
      pointPosition[index] = position;
      this.updateShapePosition(pointPosition);
      this.updateEndpointsByPosition();
      const positions = getCesiumPositions(pointPosition);
      this.currentEntity.polyline.positions = new Cesium.CallbackProperty(
        () => {
          return positions;
        },
        false
      );
    }
  }
}