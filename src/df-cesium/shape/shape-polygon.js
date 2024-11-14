/* eslint-disable no-undef */
import { ShapeBase } from "./shapeBase.js";
import { uniq } from "lodash";
import * as turf from "@turf/turf";
import {
  getShapeCenter,
  getCoordinateByCartesian,
  getMoveInfoByRefer,
} from "../utils/utils";

export class EntitiesPolygonOpation extends ShapeBase {
  constructor(arg) {
    super(arg);
    this.pointPosition = this.shapePosition;
    this.movePointPosition = this.shapePosition;
    this.currentEntity = null;
    this.addPointEntitys = []; //多边形覆盖实体-点实体  - 这里面的没有添加到shapelist中
    this.editIndex = 0; // pointPosition 操作索引
    this.temporaryPoints = []; // 临时点
    this.editIndexType = null; // 选中覆盖实体时候点击位置类型 (点击的是覆盖实体中线段还是实体覆盖点)
    this.isMoveEd = false; // 是否点击后移动
    this.croppingStatus = "0"; // 0 未裁剪  1 确认裁剪按钮后
    this.includeShapes = []; // 多边形包含的设备信息 -目前只算了包含的电力原件图标设备
    this.polygonUseType = arg.polygonUseType || "NONE"; // 裁剪 CUTTING
  }

  // 获取材质
  getMaterial(color, opacity) {
    const isDash = this.isDash;
    if (isDash) {
      return new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString(color),
        dashLength: 15, //短划线长度
      });
    } else {
      return Cesium.Color.fromCssColorString(color).withAlpha(opacity);
    }
  }

  // 设备绘制-新增
  shapeAddDraw() {
    const _this = this;
    // 创建多边形
    if (!this.pointPosition || this.pointPosition.length < 2) return;
    const pointPosition = this.pointPosition.concat();
    const positionsObj = this.getPosition(pointPosition);
    this.currentEntity = this.viewer.entities.add({
      id: this.shapeId,
      name: this.shapeName,
      polygon: {
        // 这里需要修改成用点的实体作为position
        hierarchy: new Cesium.CallbackProperty(() => {
          return {
            positions: positionsObj.positions,
          };
        }, false),
        fill: this.fill,
        height: 0,
        material: Cesium.Color.fromCssColorString(this.shapeColor).withAlpha(
          this.fillTransparency
        ),
        outline: false,
        outlineColor: Cesium.Color.fromCssColorString(
          this.outlineColor
        ).withAlpha(1),
        outlineWidth: 10,
        show: this.show,
      },

      polyline: {
        positions: new Cesium.CallbackProperty(() => {
          return positionsObj.linePositions;
        }, false),
        // cornerType: Cesium.CornerType.MITERED,
        material: _this.getMaterial(this.outlineColor, 1),
        width: 3,
        show: true,
        clampToGround: true,
        // zIndex: 2
      },
    });
  }

  // 在当前shape 上添加点
  shapeAddPoint() {
    const pointPosition = this.pointPosition.concat();
    const addPointEntitys = this.addPointEntitys.concat();
    for (var i = 0; i < pointPosition.length; i++) {
      const currentPoint = pointPosition[i];
      addPointEntitys.push(
        this.viewer.entities.add({
          name: `编辑点${i}`,
          position: Cesium.Cartesian3.fromDegrees(
            currentPoint[0],
            currentPoint[1],
            0
          ),
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

  // 更新裁剪状态
  updateCroppStatus(status, includeShapes) {
    this.croppingStatus = status;
    this.includeShapes = includeShapes;
  }

  // 选中当前shape
  selectCurrentEntity() {
    if (this.selectState) return;
    this.currentEntity.polyline.material = Cesium.Color.fromCssColorString(
      this.selectColor
    );
    if (this.isDeformation && !this.lockDeformation) {
      this.shapeAddPoint(); // 添加编辑点
    }
    this.updateSelectState(true);
  }

  // 取消选中当前shape
  cancelSelectCurrentEntity() {
    this.editIndex = 0;
    this.delAddLinPont();
    this.removeAddEntitys(); // 删除新增实体
    this.currentEntity.polyline.material = this.getMaterial(
      this.outlineColor,
      1
    );
    this.updateSelectState(false);
  }

  // 删除新增的覆盖实体-非临时
  removeAddEntitys() {
    const addEntitys = this.addPointEntitys.concat();
    if (!addEntitys || addEntitys.length < 1) return;
    for (var i = 0; i < addEntitys.length; i++) {
      this.deleteEntitie(addEntitys[i].id);
    }
    this.addPointEntitys = [];
  }

  // shape 变形
  shapeDeformationDraw(type, point, pick) {
    const _this = this;
    let points = this.pointPosition.concat();
    const pointArr = [point.longitude, point.latitude]; // 当前点经纬度坐标
    //  鼠标按下
    if (type === "LEFT_DOWN") {
      // 如果选中的是顶点
      if (pick && pick.id.id.includes("_point_")) {
        const editIndex = pick.id._description._value;

        this.editIndex = editIndex;
        this.editIndexType = "_point_";
      } else {
        // 选中边

        this.editIndexType = "_line_";
        const editIndex = this.getClickIndex(point);
        points.splice(editIndex + 1, 0, [point.longitude, point.latitude]);

        this.editIndex = editIndex;
        // 添加临时点
        this.addLinPont(point);
      }

      this.movePointPosition = points;
    }

    if (type === "MOUSE_MOVE") {
      // 鼠标移动，替换添加的点
      const editIndex = this.editIndex;
      this.isMoveEd = true;
      if (this.editIndexType === "_line_") {
        const pointsList = this.movePointPosition.concat();
        pointsList.splice(editIndex + 1, 1, pointArr);

        points = pointsList;

        const positionsObj = _this.getPosition(points);

        // 多边形变形
        _this.currentEntity.polygon.hierarchy = new Cesium.CallbackProperty(
          () => {
            return {
              positions: positionsObj.positions,
            };
          },
          false
        );

        // polyline 变形
        _this.currentEntity.polyline.positions = new Cesium.CallbackProperty(
          () => {
            return positionsObj.linePositions;
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

        this.movePointPosition = points;
      }

      // 如果选中的是覆盖点
      if (this.editIndexType === "_point_") {
        const pointsList = this.movePointPosition.concat();
        pointsList.splice(editIndex, 1, pointArr);

        points = pointsList;
        const currentSelectAddPointEntity = this.addPointEntitys[editIndex]; // 点击的覆盖点

        // 编辑点变形
        currentSelectAddPointEntity.position = new Cesium.CallbackProperty(
          () => {
            return Cesium.Cartesian3.fromDegrees(pointArr[0], pointArr[1]);
          },
          false
        );

        // polyline 变形
        const positionsObj = _this.getPosition(points);
        _this.currentEntity.polyline.positions = new Cesium.CallbackProperty(
          () => {
            return positionsObj.linePositions;
          },
          false
        );

        // 多边形变形
        _this.currentEntity.polygon.hierarchy = new Cesium.CallbackProperty(
          () => {
            return {
              positions: positionsObj.positions,
            };
          },
          false
        );

        this.movePointPosition = points;
      }
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
    const points = this.movePointPosition.concat(this.movePointPosition[0]);

    if (points.length == 2) return 0;

    const pt = turf.point([point.longitude, point.latitude]);

    // let clickIndex = null;

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

  // 删除新增的临时点
  delAddLinPont() {
    const temporaryPoints = this.temporaryPoints.concat();
    for (var i = 0; i < temporaryPoints.length; i++) {
      this.deleteEntitie(temporaryPoints[i].id);
    }
    this.temporaryPoints = [];
  }

  // 控制多边形显隐
  setCurrentEntityShow(value) {
    if (this.currentEntity) {
      this.currentEntity.polygon.show = value || false;
    }
  }

  //  删除shape
  shapeDeleteDraw() {
    this.delAddLinPont();
    this.removeAddEntitys();
    this.deleteEntitie();
  }

  // 数据转换
  getPosition(shapePosition) {
    const positions = [];
    for (var i = 0; i < shapePosition.length; i++) {
      positions.push(
        Cesium.Cartesian3.fromDegrees(
          shapePosition[i][0],
          shapePosition[i][1],
          0
        )
      );
    }
    const linePositions = positions.concat(positions[0]);
    return {
      positions: positions,
      linePositions: linePositions,
    };
  }

  // 变形鼠标松开-重新生成选中的当前shape
  updateSelectCurrentShape() {
    // 需要判断鼠标松开位置距离鼠标按下位置之间的距离，计算下鼠移动的距离

    const isMoveEd = this.isMoveEd; // 后续可以更加严谨点再加个移动距离条件
    if (isMoveEd) {
      this.pointPosition = this.movePointPosition;
    } else {
      this.movePointPosition = this.pointPosition;
    }
    this.updateShapePosition(this.pointPosition);
    this.isMoveEd = false;
    // 多边形实体上面覆盖的实体 重新生成覆盖原来的

    this.cancelSelectCurrentEntity();
    // 根据最新pointPosition 生成新的多边形
    const pointPosition = this.pointPosition.concat();
    const positionsObj = this.getPosition(pointPosition);
    this.currentEntity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
      return {
        positions: positionsObj.positions,
      };
    }, false);

    // 重新生成覆盖的线段

    this.selectCurrentEntity();
  }

  // 绘制中-鼠标移动
  updatePolyonShapePosition(params) {
    const position = uniq(params);
    this.pointPosition = position;
    this.movePointPosition = position;
    this.updateShapePosition(position);
    // 根据最新pointPosition 生成新的多边形
    const pointPosition = this.pointPosition.concat();
    const positionsObj = this.getPosition(pointPosition);

    if (!this.currentEntity) {
      this.shapeAddDraw();
    } else {
      this.currentEntity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
        return {
          positions: positionsObj.positions,
        };
      }, false);

      this.currentEntity.polyline.positions = new Cesium.CallbackProperty(
        () => {
          return positionsObj.linePositions;
        },
        false
      );
    }
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
    this.pointPosition = shapeNewPointList;
    this.movePointPosition = shapeNewPointList;
    const positionsObj = this.getPosition(shapeNewPointList);

    this.currentEntity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
      return {
        positions: positionsObj.positions,
      };
    }, false);

    this.currentEntity.polyline.positions = new Cesium.CallbackProperty(() => {
      return positionsObj.linePositions;
    }, false);
  }

  // 更新编辑点位置
  updatePointEntityPosition(distance, bearing, options) {
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

  // 更新实体位置
  updateEntityPosition(referPosition, position) {
    // 指定参考点则按照参考点移动,不指定则按照设备中心点移动位置
    const center = referPosition || getShapeCenter(this.shapePosition);

    const info = getMoveInfoByRefer(center, position);
    const { distance, bearing, options } = info;

    this.updatePolineEntityPosition(distance, bearing, options);

    this.updatePointEntityPosition(distance, bearing, options);
  }

  // 鼠标移动
  mouseMove(task, params) {
    if (
      task &&
      (task.task.key === "ADD_ACTIVE_POLYGON" ||
        task.task.key === "ADD_ACTIVE_CUTTING")
    ) {
      const { position } = params;

      const shapePosition = this.pointPosition
        ? this.pointPosition.concat()
        : [];
      const point = [position.longitude, position.latitude]; // 鼠标点击点
      shapePosition.splice(-1, 1, point); // 替换最后一个点
      this.updatePolyonShapePosition(shapePosition);
    }
  }
  // 鼠标点击
  letfClick(task, params) {
    if (
      task &&
      (task.task.key === "ADD_ACTIVE_POLYGON" ||
        task.task.key === "ADD_ACTIVE_CUTTING")
    ) {
      const { position } = params;
      const shapePosition = this.pointPosition
        ? this.pointPosition.concat()
        : [];
      const point = [position.longitude, position.latitude]; // 鼠标点击点
      shapePosition.splice(-1, 0, point); // 最后一位数据前面插入一个点

      this.updatePolyonShapePosition(shapePosition);
    }
  }

  letfDoubleClick(task, params) {
    if (
      task &&
      (task.task.key === "ADD_ACTIVE_POLYGON" ||
        task.task.key === "ADD_ACTIVE_CUTTING")
    ) {
      if (this.currentEntity) {
        this.mouseMove(task, params);
        task.removeTask();
        this.createShapeCallBack(this);
      } else {
        this.letfClick(task, params);
      }
    }
  }

  // 打开填充
  openFill() {
    // 多边形变形
    this.currentEntity.polygon.fill = true;
  }

  // 关闭填充
  closeFill() {
    this.currentEntity.polygon.fill = false;
  }
}
