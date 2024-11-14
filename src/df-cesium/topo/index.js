import { getIdGenerator } from "../utils/id-generator";
import { cloneDeep, groupBy } from "lodash";
export class Topo {
  constructor() {
    // eslint-disable-next-line constructor-super
    this.topo = [];
  }

  // 创建任务
  setTopo(topo) {
    this.topo = topo;
  }

  // 删除任务
  removeTopo() {
    this.topo = [];
  }

  // 更新topo  correlationShapes:关联的设备及端点信息
  updateTopo(correlationShapes) {
    if (!correlationShapes || correlationShapes.length < 1) return;

    let topo = cloneDeep(this.topo);

    for (var i = 0; i < correlationShapes.length; i++) {
      const shape = correlationShapes[i].shape;
      if (correlationShapes[i].type === "ADD_SHAPE") {
        const result = topo.find((item) => {
          return (
            item.psrId === shape.shapeId &&
            item.terminalId === correlationShapes[i].terminalId
          );
        });

        if (!result) {
          topo = topo.concat([
            {
              id: getIdGenerator(),
              cnodeId: correlationShapes[i].cnodeId,
              terminalId: correlationShapes[i].terminalId,
              psrId: shape.shapeId,
              psrType: shape.psrType,
              versionCode: null,
            },
          ]);
        }
      } else {
        if (!shape) return;
        // 删除元素
        // 更新链接设备的endpoints
        // this.updataShapeEndpoints("REMOVE", shape);
        // 更新topo
        // 删除所有psrId=shapeId 的topo项目
        const result = topo.filter((item) => {
          return item.psrId !== shape.shapeId;
        });

        for (var i = 0; i < result.length; i++) {
          const cnodeId = result[i].cnodeId;
          const cnodeIdArr = result.filter((item) => {
            return item.cnodeId === cnodeId;
          });

          if (cnodeIdArr.length < 2) {
            result[i].disItem = true;
          }
        }
        // 删除所有 cnodeId 小于2个的项
        const list = result.filter((item) => {
          return !item.disItem;
        });
        topo = list;
      }
    }

    this.setTopo(topo);
  }

  // 获取任务
  getTopo() {
    return this.topo;
  }

  // 根据shapeId 和topo关系找到设备连接的shape
  getConnectShapeByTopo(shapeId) {
    const connectShapes = [];
    const result = this.topo.filter((item) => {
      return item.psrId === shapeId;
    });
    for (var i = 0; i < result.length; i++) {
      const cnodeId = result[i].cnodeId;
      const subResult = this.topo.filter((subItem) => {
        return subItem.cnodeId === cnodeId && subItem.psrId !== result[i].psrId;
      });

      for (var j = 0; j < subResult.length; j++) {
        connectShapes.push({
          cnodeId: cnodeId,
          currentTerminalId: result[i].terminalId,
          terminalId: subResult[j].terminalId,
          shapeId: subResult[j].psrId,
        });
      }
    }

    return connectShapes;
  }
}
