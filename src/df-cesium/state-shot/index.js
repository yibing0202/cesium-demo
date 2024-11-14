import { History } from "stateshot";
import { differenceBy } from "lodash";

export class StateshotUndoRedo {
  constructor() {
    this.history = new History();
  }

  // 状态存储
  pushSync(state) {
    this.history.pushSync(state);
  }

  // 获取当前最新的状态
  getState() {
    return this.history.get();
  }

  // 回退操作
  undo() {
    if (!this.history.hasUndo) return;
    this.history.undo();
  }

  // 还原操作
  redo() {
    if (!this.history.hasRedo) return;
    this.history.redo();
  }

  // 回退并获取最新状态
  undoState() {
    if (!this.history.hasUndo) return;
    return this.history.undo().get();
  }
  // 还原并获取最新状态
  redoState() {
    if (!this.history.hasRedo) return;
    return this.history.redo().get();
  }
  // 获取两个状态之间的差异  oldState(回退或者还原操作以前的状态)  newState （回退或者还原操作以后的状态)
  getTwoStateDifference(oldState, newState) {
    const params = {
      type: "SAME",
      shapes: [],
    };

    if (!newState) return params;

    const result = differenceBy(
      oldState.length > newState.length ? oldState : newState,
      oldState.length > newState.length ? newState : oldState,
      "shapeId"
    );

    if (result.length > 0) {
      if (oldState.length > newState.length) {
        params.type = "REMOVE"; // 操作以前的比操作后的数据多说明要在现在基础上移除
        params.shapes = result;
      }
      if (oldState.length < newState.length) {
        params.type = "ADD"; // 操作以前的比操作后的数据多说明要在现在基础上新增
        params.shapes = result;
      }
    }
    return params;
  }
}
