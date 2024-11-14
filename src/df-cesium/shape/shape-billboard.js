/* eslint-disable no-undef */
// 底部按钮新增的电力元件设备
// 绘制图表实体
import { getCoordinate } from "../utils/utils";
import { ShapeBase } from "./shapeBase.js";

export class EntitiesBillboardOpation extends ShapeBase {
  constructor(age) {
    super(age);

    this.position = age.shapePosition;

    this.sizeInMeters = false;

    this.verticalOrigin = Cesium.VerticalOrigin.CENTER;

    this.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;

    this.currentEntity = null;
  }

  // params:经纬度
  // direction 位置
  getEndpointPosition(direction) {
    // 经纬度转屏幕坐标

    const params = this.shapePosition;
    const pick = Cesium.Cartesian3.fromDegrees(params[0], params[1], 0);
    const position = new Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      this.viewer.scene,
      pick
    );
    position.longitude = params[0];
    position.latitude = params[1];

    const endpoinPosition = {};
    if (direction === "CENTER") {
      endpoinPosition.longitude = position.longitude;
      endpoinPosition.latitude = position.latitude;
      endpoinPosition.x = position.x;
      endpoinPosition.y = position.y;
      endpoinPosition.direction = direction;
    }
    if (direction === "LEFT") {
      const currentEndpoinPosition = this.transformedPosition(
        position.x - this.shapeWidth / 2,
        position.y
      );
      endpoinPosition.longitude = currentEndpoinPosition.longitude;
      endpoinPosition.latitude = currentEndpoinPosition.latitude;
      endpoinPosition.x = position.x - this.shapeWidth / 2;
      endpoinPosition.y = position.y;
      endpoinPosition.direction = direction;
    }
    if (direction === "RIGHT") {
      const currentEndpoinPosition = this.transformedPosition(
        position.x + this.shapeWidth / 2,
        position.y
      );
      endpoinPosition.longitude = currentEndpoinPosition.longitude;
      endpoinPosition.latitude = currentEndpoinPosition.latitude;
      endpoinPosition.x = position.x + this.shapeWidth / 2;
      endpoinPosition.y = position.y;
      endpoinPosition.direction = direction;
    }
    if (direction === "TOP") {
      const currentEndpoinPosition = this.transformedPosition(
        position.x,
        position.y - this.shapeHeight / 2
      );
      endpoinPosition.longitude = currentEndpoinPosition.longitude;
      endpoinPosition.latitude = currentEndpoinPosition.latitude;
      endpoinPosition.x = position.x;
      endpoinPosition.y = position.y - this.shapeHeight / 2;
      endpoinPosition.direction = direction;
    }
    if (direction === "BOTTOM") {
      const currentEndpoinPosition = this.transformedPosition(
        position.x,
        position.y + this.shapeHeight / 2
      );
      endpoinPosition.longitude = currentEndpoinPosition.longitude;
      endpoinPosition.latitude = currentEndpoinPosition.latitude;
      endpoinPosition.x = position.x;
      endpoinPosition.y = position.y + this.shapeHeight / 2;
      endpoinPosition.direction = direction;
    }

    return endpoinPosition;
  }

  // 屏幕坐标转经纬度
  transformedPosition(x, y) {
    const _this = this;
    const params = {
      x: x,
      y: y,
    };

    const position = getCoordinate(_this.viewer, params);
    return position;
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

  // 设备绘制-新增
  shapeAddDraw() {
    if (!this.position || this.position.length < 1) return;
    this.currentEntity = this.viewer.entities.add({
      id: this.shapeId,
      name: this.shapeName,
      position: new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(
          this.position[0],
          this.position[1],
          0
        );
      }, false),

      billboard: {
        image: this.shapeIcon,
        height: this.shapeHeight,
        width: this.shapeWidth,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    if (this.currentEntity && this.endpoints.length < 1) {
      this.createEndpoints((direction) => this.getEndpointPosition(direction));
    }
  }

  removeAddEntitys() {}

  //  删除shape
  shapeDeleteDraw() {
    this.viewer.entities.removeById(this.shapeId);
  }

  // 当前设备选中
  selectCurrentEntity() {
    this.currentEntity.billboard.image = this.shapeSelectIcon;
  }

  cancelSelectCurrentEntity() {
    this.currentEntity.billboard.image = this.shapeIcon;
  }

  // 更新设备连接线端点位置
  updateEntityEndPointPosition() {
    // 获取当前设备的端点信息，更新端点信息
    //  获取设备端点链接的连线信息，更新连线实体位置信息
  }

  // 更新设备位置
  updateEntityPosition(startPosition, position) {
    this.position = position;
    this.currentEntity.position = new Cesium.CallbackProperty(() => {
      return Cesium.Cartesian3.fromDegrees(position[0], position[1], 0);
    }, false);

    this.updateShapePosition(position);
    this.updateEndpointsByPosition();
  }

  setShapePosition(position) {
    this.position = position;
    this.updateShapePosition(position);
    this.updateEndpointsByPosition();
  }

  // 鼠标移动
  mouseMove() {}

  // 鼠标点击
  letfClick(task, params) {
    if (task && task.task.key === "ADD_ACTIVE_BILLBOARD") {
      const { position } = params;
      const point = [position.longitude, position.latitude]; // 鼠标点击点
      this.setShapePosition(point);
      this.shapeAddDraw();
      this.createShapeCallBack(this);
      task.removeTask();
    }
  }

  letfDoubleClick() {}
}
