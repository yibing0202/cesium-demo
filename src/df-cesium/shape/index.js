import { EntitiesLineOpation } from "./shape-line";
import { EntitiesPolygonOpation } from "./shape-polygon";
import { EntitiesRectangleOpation } from "./shape-rectangle";
import { EntitiesCircularOpation } from "./shape-circular";
import { EntitiesBillboardOpation } from "./shape-billboard";

import * as turf from "@turf/turf";

export class ShapeList {
  constructor(age) {
    this.viewer = age.viewer;
    // eslint-disable-next-line constructor-super
    this.shapeList = [];
  }

  // 初始化地图
  initShapeList(shapes) {
    this.shapeList = shapes || [];
  }

  setShapeList(shapes) {
    this.shapeList = shapes || [];
  }

  createShapeCallBack(shape) {
    const _this = this;

    if (shape.includeShapeList) {
      const list = _this.shapeList.concat();

      list.push(shape);
      _this.shapeList = list;
    }
    shape.callback(shape);
  }

  // 新增shape
  createShape(type, params, onlyUpdateView) {
    let shape = null;
    params.createShapeCallBack = this.createShapeCallBack.bind(this);
    switch (type) {
      case "STATIC_LINE":
        params.viewer = this.viewer;
        shape = new EntitiesLineOpation(params);
        shape.shapeAddDraw();
        break;

      case "STATIC_POLYGON":
        params.viewer = this.viewer;
        shape = new EntitiesPolygonOpation(params);
        shape.shapeAddDraw();
        break;
      case "STATIC_CIRCULAR":
        params.viewer = this.viewer;
        shape = new EntitiesCircularOpation(params);
        shape.shapeAddDraw();
        break;
      case "STATIC_BILLBOARD":
        params.viewer = this.viewer;
        shape = new EntitiesBillboardOpation(params);
        shape.shapeAddDraw();
        break;
      case "ACTIVE_RECTANGLE":
        params.viewer = this.viewer;
        shape = new EntitiesRectangleOpation(params);
        shape.shapeAddDraw();
        break;
      case "ACTIVE_LINE":
        params.viewer = this.viewer;
        shape = new EntitiesLineOpation(params);
        shape.shapeAddDraw();
        break;
      case "ACTIVE_CIRCULAR":
        params.viewer = this.viewer;
        shape = new EntitiesCircularOpation(params);
        shape.shapeAddDraw();
        break;
      case "ACTIVE_POLYGON":
        params.viewer = this.viewer;
        shape = new EntitiesPolygonOpation(params);
        shape.shapeAddDraw();
        break;

      case "ACTIVE_BILLBOARD":
        params.viewer = this.viewer;
        shape = new EntitiesBillboardOpation(params);
        shape.shapeAddDraw();
        break;

      default:
        shape = null;
    }

    if (!onlyUpdateView && type.includes("STATIC_")) {
      this.createShapeCallBack(shape);
    }

    return shape;
  }

  // 删除shape
  removeShape(id) {
    const list = this.shapeList.concat();
    const shape = list.find((item) => {
      return item.shapeId === id;
    });

    if (!shape) return;
    shape.shapeDeleteDraw();
    const result = list.filter((item) => {
      return item.shapeId !== id;
    });
    this.shapeList = result;
  }
  // 更新shape
  updateShape() {}

  // 查询shape
  getShapeById(id) {
    const list = this.shapeList.concat();
    const result = list.find((item) => {
      return item.shapeId === id;
    });
    return result;
  }

  // 获取切割区域内设备
  getCuttingShapes(id) {
    const currentShape = this.getShapeById(id);
    const shapeList = this.shapeList.concat();
    const includeList = [];
    for (var i = 0; i < shapeList.length; i++) {
      if (shapeList[i].shapeId === id) continue;
      if (
        shapeList[i].shapeType === "ACTIVE_BILLBOARD" ||
        shapeList[i].shapeType === "STATIC_BILLBOARD"
      ) {
        const point = shapeList[i].position;
        const pt = turf.point(point);
        const croppingShapePosition = currentShape.pointPosition.concat([
          currentShape.pointPosition[0],
        ]);

        const poly = turf.polygon([croppingShapePosition]);
        const isInclude = turf.booleanPointInPolygon(pt, poly);
        if (isInclude) {
          includeList.push(shapeList[i]);
        }
      }
      if (
        shapeList[i].shapeType === "STATIC_LINE" &&
        !shapeList[i].isDeformation
      ) {
        let shapeInclude = false;
        const linePositions = shapeList[i].shapePosition;
        const croppingShapePosition = currentShape.pointPosition.concat([
          currentShape.pointPosition[0],
        ]);
        const poly = turf.polygon([croppingShapePosition]);

        for (var j = 0; j < linePositions.length; j++) {
          const point = linePositions[j];
          const pt = turf.point(point);
          const isInclude = turf.booleanPointInPolygon(pt, poly);
          if (!isInclude) {
            shapeInclude = false;
            break;
          } else {
            shapeInclude = true;
          }
        }

        if (shapeInclude) {
          includeList.push(shapeList[i]);
        }
      }
    }

    return includeList;
  }

  getAllShapes() {
    return this.shapeList;
  }

  // 获取模型设备复制出来的子设备
  getChildShapeById(id) {
    const list = this.shapeList.concat();
    const result = list.filter((item) => {
      return item.parentShape && item.parentShape.shapeId === id;
    });
    return result;
  }

  clearAllShapes() {
    const list = this.shapeList.concat();
    for (var i = 0; i < list.length; i++) {
      list[i].shapeDeleteDraw();
    }
    this.shapeList = [];
  }
}
