import { getIdGenerator } from "../utils/id-generator";
import { isNil } from "lodash";
export class ShapeBase {
  constructor(arg) {
    this.viewer = arg.viewer;
    this.callback = arg.callback;
    this.createShapeCallBack = arg.createShapeCallBack; // 私有回调
    this.shapeName = arg.shapeName; // 设备名称
    this.shapeIcon = arg.shapeIcon; // 设备图标
    this.shapeSelectIcon = arg.shapeSelectIcon; // 设备图标
    this.shapeShow = isNil(arg.shapeShow) ? true : arg.shapeShow; // 设备是否展示
    this.shapeAttribute = arg.shapeAttribute; // 设备属性
    this.isDeformation = arg.isDeformation || false; // 设备是否可以变形
    this.lockDeformation = isNil(arg.lockDeformation)
      ? true
      : arg.lockDeformation; // 设备是否可以变形-锁
    this.shapeId = arg.shapeId || getIdGenerator(); // 唯一值
    this.shapeWidth = arg.shapeWidth || 5;
    this.shapeHeight = arg.shapeHeight || 5;
    this.shapeColor = arg.shapeColor || "#000";
    this.shapeScale = arg.shapeScale || 1; // 缩放
    this.shapeTransform = arg.shapeTransform || {}; // 旋转信息
    this.shapeOpaMenu = arg.shapeOpaMenu; // 设备操作菜单
    this.devicekey = arg.key;
    this.fill = arg.fill || false;
    this.fillTransparency = arg.fillTransparency || 1;
    this.isDash = arg.isDash || false;
    this.outline = arg.outline || false;
    this.outlineColor = arg.outlineColor || "#000";
    this.shapePosition = arg.shapePosition || []; // 经纬度位置信息
    this.shapeType = arg.shapeType;
    this.selectColor = arg.selectColor || "#000"; // 设备选中颜色
    this.selectState = false; // 是否选中
    this.psrType = arg.psrType; // 设备类型
    this.endpointDirections = arg.endpointDirections || ["CENTER"]; // 定义设备有哪几个方位的端点 支持LEFT、RIGHT、CENTER、TOP、BOTTOM
    this.endpoints = arg.endpoints || []; // 该端点详细信息 endpointId 、position
    this.shapeCanMove = isNil(arg.shapeCanMove) ? true : arg.shapeCanMove; // 设备在地图上是否可以拖动
    this.modalShape = arg.modalShape || false; // 是否是模型设备
    this.modalShapeCopyNumbers = arg.modalShapeCopyNumbers || "innumerable"; // 模型可复制多少个设备数量
    this.modalCopyShapeType = arg.modalCopyShapeType || "1"; //1覆盖最前面的 2不能再次复制 模型设备复制数量超出modalShapeCopyNumbers是覆盖前面还是不能复制
    this.parentShape = arg.parentShape || null; // 父级模型设备
    this.modalCopyShapeConfig = arg.modalCopyShapeConfig || arg;
    this.includeShapeList = isNil(arg.includeShapeList) // 是否添加到shapeList
      ? true
      : arg.includeShapeList;
  }

  // 更新设备属性信息
  updateShapeAttr(value) {
    this.shapeAttribute = value;
  }

  // 更新位置信息
  updateShapePosition(params) {
    this.shapePosition = params;
  }

  // 更新设备选中状态
  updateSelectState(state) {
    this.selectState = state;
  }

  // 更新设备变形锁开关
  updateLockDeformationState(state) {
    if (this.isDeformation) {
      this.lockDeformation = state;
    }
  }

  // 根据id 删除实体
  deleteEntitie(id) {
    this.viewer.entities.removeById(id || this.shapeId);
  }

  // params 端点方向数组
  // getEndpointPosition 设备position的方法
  createEndpoints(getEndpointPosition) {
    const params = this.endpointDirections || [];

    if (params.length < 1) return;
    const endpoints = [];
    for (var i = 0; i < params.length; i++) {
      endpoints.push({
        endpointId: getIdGenerator(), // 端点ID
        position: getEndpointPosition(params[i]),
      });
    }

    this.endpoints = endpoints;
  }

  // 关闭设备移动状态
  closeShapeMove() {
    this.shapeCanMove = false;
  }
  // 打开设备移动状态
  openShapeMove() {
    this.shapeCanMove = true;
  }

  updateSelfEndpoints(params) {
    this.endpoints = params;
  }
}
