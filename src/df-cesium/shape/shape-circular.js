/* eslint-disable no-undef */
// 底部按钮新增的电力元件设备
// 绘制图表实体
import { getTwoPointsDistance } from "../utils/utils";
import { ShapeBase } from "./shapeBase.js";
import * as turf from "@turf/turf";

export class EntitiesCircularOpation extends ShapeBase {
  constructor(arg) {
    super(arg);

    this.position = arg.shapePosition || []; // 圆心坐标

    this.currentEntity = null;

    this.semiMinorAxis = arg.semiMinorAxis || null;

    this.semiMajorAxis = arg.semiMajorAxis || null;
  }

  // 根据边界点计算半径
  getRadiusByEndPosition(endPosition) {
    if (
      !this.position ||
      this.position.length < 1 ||
      !endPosition ||
      endPosition.length < 1
    )
      return;
    const circularRadius = getTwoPointsDistance(this.position, endPosition);
    this.semiMinorAxis = circularRadius;
    this.semiMajorAxis = circularRadius;
  }

  // 设备绘制-新增
  shapeAddDraw() {
    if (
      !this.position ||
      this.position.length < 1 ||
      !this.semiMinorAxis ||
      !this.semiMajorAxis
    )
      return;

    this.currentEntity = this.viewer.entities.add({
      id: this.shapeId,
      name: this.shapeName,
      position: new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(
          this.position[0],
          this.position[1]
        );
      }, false),

      ellipse: {
        semiMinorAxis: new Cesium.CallbackProperty(() => {
          return this.semiMinorAxis;
        }, false),
        semiMajorAxis: new Cesium.CallbackProperty(() => {
          return this.semiMajorAxis;
        }, false),
        height: 0,
        // rotation: Cesium.Math.toRadians(-40.0),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(
          this.outlineColor
        ).withAlpha(1),
        outlineWidth: 40,
        material: Cesium.Color.fromCssColorString(this.shapeColor).withAlpha(
          this.fillTransparency
        ),
      },
    });
  }

  removeAddEntitys() {}

  //  删除shape
  shapeDeleteDraw() {
    this.deleteEntitie();
  }

  // 当前设备选中
  selectCurrentEntity() {
    this.currentEntity.ellipse.outlineColor = Cesium.Color.fromCssColorString(
      this.selectColor
    ).withAlpha(1);
  }

  cancelSelectCurrentEntity() {
    this.currentEntity.ellipse.outlineColor = Cesium.Color.fromCssColorString(
      this.outlineColor
    ).withAlpha(1);
  }

  updateEntityPosition(referPosition, position) {
    // 指定参考点则按照参考点移动,不指定则按照设备中心点移动位置
    const center = referPosition || this.position;

    // 计算两个点之间的角度
    const point1 = turf.point(
      center.geometry ? center.geometry.coordinates : center
    );
    const point2 = turf.point(position);
    const bearing = turf.bearing(point1, point2);

    // 计算两点之间的距离
    const options = { units: "miles" };
    const distance = turf.distance(point1, point2, options);

    const point = turf.point(this.position);
    const destination = turf.destination(point, distance, bearing, options);

    const postion = destination.geometry.coordinates;

    this.currentEntity.position = new Cesium.CallbackProperty(() => {
      return Cesium.Cartesian3.fromDegrees(postion[0], postion[1]);
    }, false);

    this.position = postion;
    this.updateShapePosition(postion);
  }

  // 根据边界点更新圆的半径
  updateShapeCircularRadius(position) {
    this.getRadiusByEndPosition(position);

    if (!this.currentEntity) {
      this.shapeAddDraw();
    }
  }

  // 鼠标移动
  mouseMove(task, params) {
    if (task && task.task.key === "ADD_ACTIVE_CIRCULAR") {
      const { position } = params;
      const shapePosition = this.position ? this.position.concat() : [];
      const point = [position.longitude, position.latitude]; // 鼠标点击点
      if (shapePosition.length > 0) {
        this.updateShapeCircularRadius(point);
      }
    }
  }

  // 鼠标点击
  letfClick(task, params) {
    if (task && task.task.key === "ADD_ACTIVE_CIRCULAR") {
      const { position } = params;
      const shapePosition = this.position ? this.position.concat() : [];
      const point = [position.longitude, position.latitude]; // 鼠标点击点
      if (shapePosition.length > 0) {
        this.updateShapeCircularRadius(point);
        task.removeTask();
        this.createShapeCallBack(this);
      } else {
        const params = shapePosition.concat(point);
        this.position = params;
        this.updateShapePosition(params);
      }
    }
  }

  letfDoubleClick() {}

  // 放大/缩小
  zoom(step) {
    if (!isNaN(parseFloat(step)) && isFinite(step)) {
      if (!step || step < 0) return;

      const semiMinorAxis = this.semiMinorAxis * step || 1;
      const semiMajorAxis = this.semiMajorAxis * step || 1;
      this.semiMinorAxis = semiMinorAxis;
      this.semiMajorAxis = semiMajorAxis;

      this.currentEntity.ellipse.semiMinorAxis = new Cesium.CallbackProperty(
        () => {
          return this.semiMinorAxis;
        },
        false
      );

      this.currentEntity.ellipse.semiMajorAxis = new Cesium.CallbackProperty(
        () => {
          return this.semiMajorAxis;
        },
        false
      );
    }
  }
}
