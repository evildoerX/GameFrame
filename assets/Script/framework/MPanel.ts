import { G } from "./G";
import { MRes } from "./MRes";

const { ccclass, property } = cc._decorator
enum MOVE_DIRECTION { LEFT, RIGHT, TOP, BOTTOM }
const C = {
    PATH: 'panel',
    TIME: 0.5,
    EASE_IN: cc.easeExponentialOut(),
    EASE_OUT: cc.easeExponentialOut(),
    /** 某些组件在scale=0时会出现一些错位等问题，因此将初始值设为0.001 */
    SCALE_0: 0.001,
    SCALE_1: 1,
}
Object.freeze(C)

/**
 * [framework-M] 游戏窗口管理
 * - 封装窗口打开的open\close接口，API为open\close\chain；open和close时会附带参数；open的异步结束不包括动画效果，close的异步结束包括动画效果
 * - 封装窗口中UI打开的in\out接口，API为in\out+type
 * - 窗口的打开直接调用active=true；窗口中UI组件的打开方式可以使用写定的方法；未来会独立成为脚本
 * - [注意] 未来可能需要调整并增加node.stopAllActions()
 * - [注意] 目前仅支持同种窗口单个单个显示
 * - [注意] 虽然格式上是static函数，但是需要在场景中挂载激活，使用到了MPanel.ins
 * - [注意] 场景中仅有一个MPanel脚本生效，只挂载1次即可
 */
@ccclass
export class MPanel extends cc.Component {

    static ins: MPanel

    onLoad() {
        MPanel.ins = this
    }

    @property({ tooltip: 'panel所挂载的父节点', type: cc.Node })
    parent: cc.Node = null

    /** 当前的渲染层级 */
    private now_z_index: number = 0

    /** panel-实例节点存储 */
    private obj_node = {}

    /** panel-prefab存储 */
    private obj_prefab = {}

    /**
     * 打开panel
     * - [注意] open的异步结束不包括动画效果
     * @param panel_name
     * @param args
     * @static
     * @async
     */
    static async open(panel_name: string, ...args: any[]) {
        const z_index = MPanel.ins.now_z_index += 1
        const show_panel = (prefab: cc.Prefab) => {
            // 删除同名节点
            if (MPanel.ins.obj_node[panel_name]) { MPanel.ins.obj_node[panel_name].destroy() }
            // 创建新节点
            let node = cc.instantiate(prefab)
            node.setParent(MPanel.ins.parent)
            node.position = cc.Vec2.ZERO
            node.width = cc.winSize.width
            node.height = cc.winSize.height
            node.zIndex = z_index
            node.active = true
            // 如果节点有打开动画，则进行打开动画
            if (node.getComponent(panel_name) && node.getComponent(panel_name).open) {
                node.getComponent(panel_name).open(...args)
            }
            // 保存节点
            MPanel.ins.obj_node[panel_name] = node
        }
        // 优先从prefab存储中寻找
        if (MPanel.ins.obj_prefab[panel_name]) {
            show_panel(MPanel.ins.obj_prefab[panel_name])
        }
        // 如果找不到则从resource中载入
        await MRes.load_res(`${C.PATH}/${panel_name}`, cc.Prefab).then((v: cc.Prefab) => {
            // 保存prefab
            MPanel.ins.obj_prefab[v.name] = v
            show_panel(v)
        }).catch(() => {
            cc.error(`panel to open is not exist, panel_name= ${panel_name}`)
        })
    }

    /**
     * 关闭panel
     * - close的异步结束包括动画效果；因此具体panel的close()方法实现必须要是一个async函数
     * @param panel_name
     * @param args
     * @static
     * @async
     */
    static async close(panel_name: string, ...args: any[]) {
        // 获取节点
        let node: cc.Node = MPanel.ins.obj_node[panel_name]
        if (node === undefined) {
            cc.warn(`panel to close is not exist, panel_name= ${panel_name}`)
            return
        }
        // 执行节点关闭动画
        if (node.getComponent(panel_name) && node.getComponent(panel_name).close) {
            await node.getComponent(panel_name).close(...args)
        }
        // 删除节点存储
        node.destroy()
        delete MPanel.ins.obj_node[panel_name]
    }

    /**
     * 链式打开多个panel
     * - 打开的panel无参数传入
     * - 默认interval为1s
     * @param array_panel_name 多个panel的name
     */
    static async chain(...array_panel_name: string[]) {
        for (let i = 0; i < array_panel_name.length; i += 1) {
            await MPanel.open(array_panel_name[i])
            await G.wait_time(1)
        }
    }

    //////////
    // 配置的默认数值
    //////////

    static get TIME() { return C.TIME }
    static get EASE_IN() { return C.EASE_IN }
    static get EASE_OUT() { return C.EASE_OUT }
    static get MOVE_DIRECTION() { return MOVE_DIRECTION }

    //////////
    // UI方法
    //////////

    /** 
     * @param node
     * @static
     * @async
     */
    static async in_nothing(node: cc.Node) {
        node.active = true
    }

    /** 
     * @param node
     * @static
     * @async
     */
    static async out_nothing(node: cc.Node) {
        node.active = false
    }

    /** 
     * @param node
     * @param time
     * @param ease
     * @static
     * @async
     */
    static async in_scale(node: cc.Node, time: number = C.TIME, ease: any = C.EASE_IN) {
        return await new Promise((resolve, reject) => {
            node.scale = C.SCALE_0
            node.active = true
            node.runAction(cc.sequence(
                cc.scaleTo(time, C.SCALE_1).easing(ease),
                cc.callFunc(resolve),
            ))
        })
    }

    /** 
     * @param node
     * @param time
     * @param ease
     * @static
     * @async
     */
    static async out_scale(node: cc.Node, time: number = C.TIME, ease: any = C.EASE_OUT) {
        return await new Promise((resolve, reject) => {
            node.runAction(cc.sequence(
                cc.scaleTo(time, C.SCALE_0).easing(ease),
                cc.callFunc(resolve),
            ))
        })
    }

    /** 
     * @param node
     * @param time
     * @param ease
     * @static
     * @async
     */
    static async in_fade(node: cc.Node, time: number = C.TIME, ease: any = C.EASE_IN) {
        return await new Promise((resolve, reject) => {
            node.opacity = 0
            node.active = true
            node.runAction(cc.sequence(
                cc.fadeIn(time).easing(ease),
                cc.callFunc(resolve),
            ))
        })
    }

    /** 
     * @param node
     * @param time
     * @param ease
     * @static
     * @async
     */
    static async out_fade(node: cc.Node, time: number = C.TIME, ease = C.EASE_OUT) {
        return await new Promise((resolve, reject) => {
            node.runAction(cc.sequence(
                cc.fadeOut(time).easing(ease),
                cc.callFunc(resolve),
            ))
        })
    }

    /**
     * @param node 
     * @param direction 
     * @param time 
     * @param ease 
     * @static
     * @async
     */
    static async in_move(node: cc.Node, direction: MOVE_DIRECTION = MOVE_DIRECTION.LEFT, time = C.TIME, ease = C.EASE_IN) {
        return await new Promise((resolve, reject) => {
            let start_position: cc.Vec2;
            let end_postion: cc.Vec2 = node.position
            switch (direction) {
                case MOVE_DIRECTION.LEFT:
                    start_position = end_postion.add(cc.v2(-cc.winSize.width, 0))
                    break;
                case MOVE_DIRECTION.RIGHT:
                    start_position = end_postion.add(cc.v2(cc.winSize.width, 0))
                    break;
                case MOVE_DIRECTION.TOP:
                    start_position = end_postion.add(cc.v2(0, cc.winSize.height))
                    break;
                case MOVE_DIRECTION.BOTTOM:
                    start_position = end_postion.add(cc.v2(0, -cc.winSize.height))
                    break;
                default:
                    break;
            }
            node.position = start_position
            node.active = true
            node.runAction(cc.sequence(
                cc.moveTo(time, end_postion).easing(ease),
                cc.callFunc(resolve),
            ))
        })
    }

    /**
     * @param node 
     * @param direction 
     * @param time 
     * @param ease 
     * @static
     * @async
     */
    static async out_move(node: cc.Node, direction: MOVE_DIRECTION = MOVE_DIRECTION.LEFT, time = C.TIME, ease = C.EASE_IN) {
        return await new Promise((resolve, reject) => {
            let start_position: cc.Vec2 = node.position
            let end_postion: cc.Vec2
            switch (direction) {
                case MOVE_DIRECTION.LEFT:
                    end_postion = start_position.add(cc.v2(-cc.winSize.width, 0))
                    break;
                case MOVE_DIRECTION.RIGHT:
                    end_postion = start_position.add(cc.v2(cc.winSize.width, 0))
                    break;
                case MOVE_DIRECTION.TOP:
                    end_postion = start_position.add(cc.v2(0, cc.winSize.height))
                    break;
                case MOVE_DIRECTION.BOTTOM:
                    end_postion = start_position.add(cc.v2(0, -cc.winSize.height))
                    break;
                default:
                    break;
            }
            node.runAction(cc.sequence(
                cc.moveTo(time, end_postion).easing(ease),
                cc.callFunc(resolve),
            ))
        })
    }
}