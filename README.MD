## **快速入门**

安装

    npm install df-cesium-application --save

使用:

- html 中添加 dom 节点，节点需要绑定一个唯一的的 ID

  ```
  <div id="dfCesiumContainer"></div>
  ```

- javascript 中定义初始化地图方法

```
    import { createDfCesiumApplication } from "df-cesium-application";

    const dfcesium = async (params, cssUrl, jsUrl)=>{
         return  await createDfCesiumApplication(params, cssUrl, jsUrl)
    }

```

**_调用 initMap 这个时候你在界面上已经可以看到一个地球!!!_**

参数说明

| name                    | Type   | Default | Description                                                                                                                                              |
| ----------------------- | ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mapType                 | String | -       | 要加载的地图类型,参数支持 GAUDMAP（高德地图）                                                                                                            |
| shapeCanMove            | Boole  | true    | 地图设备是否可移动（全局控制）                                                                                                                           |
| shapeMoveAndConnectLine | Boole  | true    | 设备拖动的时候连接线是否跟随变动保持链接状态                                                                                                             |
| defaultAccessToken      | String | -       | cesium 官网申请的 defaultAccessToken                                                                                                                     |
| options                 | object | -       | \[参考: new Cesium.Viewer 中的 options ]\([Viewer - Cesium Documentation](http://cesium.xin/cesium/cn/Documentation1.95/Viewer.html?classFilter=Viewer)) |
| container               | String | -       | html 中绑定的地图 ID                                                                                                                                     |
| handlerCallBack         | fun    | -       | 地图点击交互相关事件回调                                                                                                                                 |
| mapRenderOverCallBack   | fun    | -       | 地图瓦片监听回调，当瓦片加载完毕后会自动触发                                                                                                             |
| cameraHeightChange      | fun    | -       | 地图比例尺 change 回调                                                                                                                                   |
| cssUrl                  | String | -       | cesium 包 css 引入路径                                                                                                                                   |
| jsUrl                   | String | -       | cesium 包 js 引入路径                                                                                                                                    |

## API 手册

#### 地图

| name                         | Type | Default | Description                                          |
| ---------------------------- | ---- | ------- | ---------------------------------------------------- |
| closeShapeMove               | fun  | -       | 禁止全局设备移动                                     |
| openShapeMove                | fun  | -       | 开启全局设备移动                                     |
| openShapeMoveAndConnectLine  | fun  | -       | 开启设备移动连接线跟随开关                           |
| closeShapeMoveAndConnectLine | fun  | -       | 关闭设备移动连接线跟随开关                           |
| setPositionViewer(local)     | fun  | -       | 无感定位 local: {longitude:xx,latitude:xx,height:xx} |
| setPositionByFly(local)      | fun  | -       | 飞行定位 local: {longitude:xx,latitude:xx,height:xx} |
| mapMoveDisabled              | fun  | -       | 禁止地图拖动                                         |
| mapMoveEnabled               | fun  | -       | 开启地图拖动                                         |
| switchVecImageryLayer        | fun  | -       | 切换矢量地图                                         |
| switchImgImageryLayer        | fun  | -       | 切换影像地图                                         |
| getViewScreenCenterPosition  | fun  | -       | 获取屏幕中心点屏幕坐标                               |
| openMousePoint               | fun  | -       | 打开鼠标跟随点                                       |
| delMousePoint                | fun  | -       | 关闭鼠标跟随点                                       |

#### 绘制

- 设备基础配置信息（后面涉及到的所有设备配置信息字段均以此为参考）

```
import { ShapeBaseConfig } from "df-cesium-application";
const shapeConfig = new ShapeBaseConfig(config)
```

参数 config 说明：

| name                  | Type   | Default        | Description                                                                                                                                                                                                                                                                                    |
| --------------------- | ------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shapeName             | String | -              | 设备名称                                                                                                                                                                                                                                                                                       |
| shapeId               | object | 自动生成非必传 | 设备 ID（雪花 ID）                                                                                                                                                                                                                                                                             |
| callback              | fun    | -              | 设备创建完成的回调                                                                                                                                                                                                                                                                             |
| shapeIcon             | String | -              | 设备默认图标（创建图标类设备使用）                                                                                                                                                                                                                                                             |
| shapeSelectIcon       | String | -              | 设备选中后图标(创建图标类设备使用)                                                                                                                                                                                                                                                             |
| shapeShow             | Boole  | true           | 设备是否展示                                                                                                                                                                                                                                                                                   |
| shapeAttribute        | object | -              | 设备属性信息                                                                                                                                                                                                                                                                                   |
| isDeformation         | Boole  | false          | 设备是否可以变形（可变形设备时可设置）                                                                                                                                                                                                                                                         |
| lockDeformation       | Boole  | true           | 设备是否可以变形-开关锁                                                                                                                                                                                                                                                                        |
| shapeWidth            | Number | 5              | 设备宽                                                                                                                                                                                                                                                                                         |
| shapeHeight           | Number | 5              | 设备高                                                                                                                                                                                                                                                                                         |
| shapeColor            | String | "#000"         | 设备颜色                                                                                                                                                                                                                                                                                       |
| selectColor           | String | "#000"         | 设备选中颜色                                                                                                                                                                                                                                                                                   |
| shapeScale            | Number | 1              | 设备缩放 （大于 1 放大小于 1 缩小，不能小于 0）                                                                                                                                                                                                                                                |
| shapeTransform        | object | -              | 设备旋转信息                                                                                                                                                                                                                                                                                   |
| shapeOpaMenu          | Array  | []             | 为设备配置的操作菜单（例如删除等）                                                                                                                                                                                                                                                             |
| fill                  | Boole  | false          | 是否填充                                                                                                                                                                                                                                                                                       |
| fillTransparency      | Number | 1              | 填充透明度                                                                                                                                                                                                                                                                                     |
| outline               | Boole  | false          | 是否有边框                                                                                                                                                                                                                                                                                     |
| isDash                | Boole  | false          | 边框是否虚线                                                                                                                                                                                                                                                                                   |
| outlineColor          | String | "#000"         | 边框颜色                                                                                                                                                                                                                                                                                       |
| shapePosition         | Array  | []             | 位置信息                                                                                                                                                                                                                                                                                       |
| shapeType             | String | -              | 设备类型（线段：STATIC_LINE, 具有宽和高的多边形：STATIC_POLYGON,圆：STATIC_CIRCULAR,图标：STATIC_BILLBOARD,鼠标根据起始点和对角线顶点动态创建矩形:ACTIVE_RECTANGLE,动态创建线段:ACTIVE_LINE,根据鼠标动态创建圆:ACTIVE_CIRCULAR,动态创建多边形:ACTIVE_POLYGON,标点击创建图标：ACTIVE_BILLBOARD) |
| semiMinorAxis         | String | -              | 圆半径信息其中一个轴线                                                                                                                                                                                                                                                                         |
| semiMajorAxis         | String | -              | 圆半径信息其中一个轴线                                                                                                                                                                                                                                                                         |
| psrType               | String | -              | 设备标识类型（绘图业务中 psrType 比如变电站等）                                                                                                                                                                                                                                                |
| endpointDirections    | Array  | ["CENTER"]     | 定义设备有哪几个方位的端点 支持 LEFT、RIGHT、CENTER、TOP、BOTTOM                                                                                                                                                                                                                               |
| endpoints             | Array  | []             | 该端点详细信息 包含 endpointId 、position,新建设备时候会自动生成                                                                                                                                                                                                                               |
| polygonUseType        | String | "NONE"         | 对变形是否应用为裁剪,值为 CUTTING 为裁剪                                                                                                                                                                                                                                                       |
| shapeCanMove          | Boole  | true           | 设备在地图上是否可以拖动                                                                                                                                                                                                                                                                       |
| modalShape            | Boole  | false          | 是否是模型设备                                                                                                                                                                                                                                                                                 |
| modalShapeCopyNumbers | Number | "innumerable"  | 模型可复制多少个设备数量,默认无限个                                                                                                                                                                                                                                                            |
| modalCopyShapeType    | String | "1"            | 超出模型可复制数量时候 1 可再次复制但覆盖 2 无法再赋值                                                                                                                                                                                                                                         |
| parentShape           | object | null           | 设备的父级模型设备                                                                                                                                                                                                                                                                             |
| modalCopyShapeConfig  | object | null           | 模型设备复制出来的子设备配置信息                                                                                                                                                                                                                                                               |

- 创建设备

```
  dfcesium.createShape（key, params）
```

参数说明
| name | Type | Default | Description |
| --- | --- |--- |--- |
| key | String | - | 设备类型 |
| params | object | - | 设备配置信息 new ShapeBaseConfig({...}) |

- 指定设备以及设备连接点信息创建连接线

```
dfcesium.createConnectLine(lineConfig,startShape,endshape,startShapeDirection,endshapeDirection)
```

参数说明
| name | Type | Default | Description |
| --- | --- |--- |--- |
| lineConfig | object | - | 连接线配置信息 |
| startShape | object | - | 起始设备|
| endshape | fun | - | 结束设备 |
| startShapeDirection | String | - | 起始设备端点位置 |
| endshapeDirection | String | - | 结束设备端点位置 |

- 获取当前选中的设备列表

```
dfcesium.getSelectShapes()
```

- 取消选中某个设备

```
dfcesium.removeSelectShapeById(shapeId)
```

- 清空全部选中的设备

```
dfcesium.clearSelectShapes()
```

- 初始化设备列表

```
dfcesium.initShapeList(shapeList)   // shapeList 所有创建的设备list
```

- 获取视图 topo

```
dfcesium.getTopo()
```

- 设置链接 topo 关系

```
dfcesium.setTopo(topo)
```

topo 数据参数说明

```
[{
  "id":"", // 雪花 id ,唯一值
  "cnodeId":"", 连接点 ID,雪花 ID 生成,一个连接点 ID 对应多个链接关系
  "terminalId":"", 连接点对应的设备端点 ID
  "psrId":"", 连接点对应的设备 ID
  "psrType":"", 连接点对应的设备类型
  "versionCode":""  // 版本号
 }
 ...

 ]
```

- 获取所有设备

```
dfcesium.getAllShapes();
```

- 根据 id 获取设备

```
dfcesium.getShapeById(shapeId)
```

- 根据 id 删除设备

```
dfcesium.removeShape(shapeId)
```

- 删除设备（只更新视图不更新 shapeList）

```
dfcesium.shapeDeleteDraw(shapeId)
```

- 获取多边形区域内设备

```
dfcesium.getPolyGonIncludeShapes(shapeId)
```

- 添加暂存区

```
dfcesium.pushSync()
```

- 撤销

```
dfcesium.undoOperate()
```

- 还原

```
dfcesium.redoOperate()
```

- 根据 topo 关系推算获取所有的连接线设备

```
dfcesium.getLineShapeList(shapes, topo, psrType);
```

- 创建自定义任务

```
dfcesium.task.createTask(params);
```

任务参数

```
{
    key:'xxx',   // 任务key值
    params:{}   // 任务信息
}
```

- 获取当前任务

```
dfcesium.task.getTask();
```

- 删除任务

```
dfcesium.task.removeTask();
```

#### 设备

- 更新设备属性信息

```
shape.updateShapeAttr(params)
```

- 开启设备可移动功能

```
shape.openShapeMove()
```

- 关闭设备移动功能

```
shape.closeShapeMove()
```

- 更新设备是否可以变形锁开关状态

```
shape.updateLockDeformationState(bool)
```

- 开启设备填充（只针对多边形设备）

```
shape.openFill()
```

- 关闭设备填充（只针对多边形设备）

```
shape.closeFill()
```

- 设备移动

```
shape.updateEntityPosition(startPosition, endPosition)
```

- 设备放大/缩小 （目前只支持圆)

```
shape.zoom(size) // size>1 放大 size<1 缩小 size不能小于0
```

- 更新设备裁剪和未裁剪状态（只针对多边形设备）

```
shape.updateCroppStatus(state,includeShapes)  // 0 未裁剪 1 已裁剪  includeShapes：包含的设备
```

## 默认交互介绍

1.多边形(包含矩形）和线段设备如果设置可以变形，且变形开关没有被锁定，则点击设备会给设备添加编辑点，当编辑点出现时设备处于变形编辑状态，拖动设备设备可自由变形，如果设备不可以变形或者设备变形开关被锁定，则点击设备不会添加编辑点

2.默认长按设备移动设备可跟随移动，如果设备处于变形状态时候会执行变形不会执行移动，如果设备是模型设备，模型不会移动，长按可复制子设备

3.图标设备移动时候默认连接线会跟随图标设备移动位置，保持链接关系

4.删除设备时候自身连接线也同步删除

5.动态创建设备阶段会展示鼠标跟随点
