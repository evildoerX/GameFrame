// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Node)
    content: cc.Node = null;

    @property(cc.Prefab)
    squareItem: cc.Prefab = null


    //每一行的格子数
    squareNum: number = 4

    //格子的二维数组  横向
    _sqrt: cc.Node[][] = null

    //格子的二维数组  竖向
    _sqrt2: cc.Node[][] = null

    onLoad () {
        this.initGame();
    }

    start () {

    }

    initGame() {
        this.initSqureItem()
    }

    // 初始化格子的位置
    initSqureItem () {
        this._sqrt = new Array();
        this._sqrt2 = new Array();

        //多维数组不能直接定义多维，只能层层定义，很多高级语言都是如此
        for (let i = 0; i < this.squareNum; i++) {
            this._sqrt2[i] = new Array();//多维数组层层定义
        }

        for (let i = 0; i < this.squareNum; i++) {
            this._sqrt[i] = new Array();//多维数组层层定义
            for (let j = 0; j < this.squareNum; j++) {
                let item = cc.instantiate(this.squareItem);
                item.name = i + "" + j;
                console.log('item.name', item.name)
                // item.getComponent(Item).showNumber(2);
                this._sqrt[i][j] = item;
                this._sqrt2[j][i] = item;
                this.content.addChild(item);
                //计算位置
                this.initPos(item, i, j);
            }
        }
    }

    //初始化位置 ，不用layout组件
    initPos(item: cc.Node, i: number, j: number) {
        let x = item.width * j + item.width / 2 + (j + 1) * 5 - 290;
        let y = item.height * i + item.width / 2 + (i + 1) * 5 - 290;
        item.position = cc.v2(x, -y);
    }

    // update (dt) {}
}
