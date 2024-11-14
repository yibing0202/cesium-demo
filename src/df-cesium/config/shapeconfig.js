import { isNil } from "lodash";
export class ShapeConfig {
  constructor(arg) {
    this.shapeId = arg.shapeId;
    this.callback = arg.callback; // 设备创建完完成后的回调
    this.shapeName = arg.shapeName; // 设备名称
    this.shapeIcon = arg.shapeIcon; // 设备图标
    this.shapeSelectIcon = arg.shapeSelectIcon; // 设备选中图标
    this.shapeShow = isNil(arg.shapeShow) ? true : arg.shapeShow; // 设备是否展示
    this.shapeAttribute = arg.shapeAttribute; // 设备属性
    this.isDeformation = arg.isDeformation || false; // 设备是否可以变形
    this.lockDeformation = isNil(arg.lockDeformation)
      ? true
      : arg.lockDeformation; // 设备是否可以变形-锁
    this.shapeWidth = arg.shapeWidth || 5;
    this.shapeHeight = arg.shapeHeight || 5;
    this.shapeColor = arg.shapeColor || "#000"; // 设备颜色
    this.shapeScale = arg.shapeScale || 1; // 缩放
    this.shapeTransform = arg.shapeTransform || {}; // 旋转信息
    this.shapeOpaMenu = arg.shapeOpaMenu; // 设备操作菜单
    this.fill = arg.fill || false; // 是否填充
    this.fillTransparency = arg.fillTransparency || 1; // 填充透明度
    this.isDash = arg.isDash || false; // 是否虚线边不边框
    this.outline = arg.outline || false; // 是否有外边框
    this.outlineColor = arg.outlineColor || "#000"; // 外边框颜色
    this.shapePosition = arg.shapePosition || []; // 位置信息
    this.shapeType = arg.shapeType; // 设备类型，前端定制，参考demo
    this.selectColor = arg.selectColor || "#000"; // 设备选中颜色
    this.semiMinorAxis = arg.semiMinorAxis || null; // 圆半径信息其中一个轴线
    this.semiMajorAxis = arg.semiMajorAxis || null; // 圆半径信息其中一个轴线
    this.psrType = arg.psrType; // 设备类型
    this.endpointDirections = arg.endpointDirections || ["CENTER"]; // 定义设备有哪几个方位的端点 支持LEFT、RIGHT、CENTER、TOP、BOTTOM
    this.endpoints = arg.endpoints || []; // 该端点详细信息 endpointId 、position
    this.polygonUseType = arg.polygonUseType || "NONE";
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
}
