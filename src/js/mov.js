import $ from 'jquery';
import axios from 'axios';
import result_template from '../template/result.hbs';
import CXHttpUtils from 'cx_common_lib/commonModules/CXHttpUtils.js'
import CXDateFormat from 'cx_common_lib/commonModules/CXDateFormat'
import cxm_core from "qisz-cxm-core";

// 設定jsonのURL
const conf_json_url = 'json/conf.json';

// 結果jsonのURL(ローカルのテストデータ)
// const result_json_url = 'json/result.json';
// const result_json_url = 'json/result_2.json';

// 結果jsonのURL(テスト用)
const result_json_url = 'http://18.180.179.87/data/1_outputq.json';

// 日付フォーマッター
let _df = new CXDateFormat('yyyy-MM-dd HH:mm:ss')



$(function(){
    console.log("mov.js");

    axios.get(conf_json_url).then((res)=>{
        console.log(res.data);
        init(res.data);
        addLinstner(res.data);
        
    })
})

/*
* 初期化処理
*/
const init = (conf) => {
    console.log("init() ----")

    let cxmObj;
    let args = {};

    // 状態json(sloth)のURL
    args.statecheck_url = conf.statecheck_url;

    // 状態json(sloth)監視するポーリング間隔
    args.statecheck_interval = 100;

    // イベント開始インターバル　プロパティ名
    args.prop_name_event_start_interval = 'mov_start_interval';

    // 状態フラグ変更日時　プロパティ名
    args.prop_name_state_change_datetime = "startDateMS";
    
    // サーバータイム取得用ファイル の URL (必須の引数)
    args.timecheck_url = "./json/empty.json";


    // 準備状態になったときの処理
    args.event_func_ready = () => {
        // 準備状態
        console.log("event_func_ready ----")
        console.log(_df.format(new Date()))
    };

    // 予定時間になる前の処理
    args.event_func_start_before = () => {
        // 予定時間になる前
        console.log("event_func_start_before ----")
        console.log(_df.format(new Date()))
    };

    // 予定時間にちょうどなったときの処理
    args.event_func_start_just = () => {
        // 予定時間にちょうどなった
        // TODO　動画を再生
        console.log("event_func_start_just ----")
        console.log(_df.format(new Date()))
        document.getElementById('mov').play();
    };
    
    // 予定時間をすでに過ぎていたときの処理
    args.event_func_start_after = async () => {
        // 予定時間をすでに過ぎていた
        console.log("event_func_start_after ----")
        console.log(_df.format(new Date()))
        // effectStart();
    };

    console.log(args)

    cxmObj = new cxm_core(args);
    cxmObj.exec();
}

/*
* リスナ登録
*/
const addLinstner = (conf) => {
    let _mov = document.getElementById('mov');
    let _playTimer;

    _mov.addEventListener("loadeddata", ()=>{
        console.log("loadeddata");
        setTimeout(()=>{
            // $("#cover").addClass("hide");
            $("#cover .btn").addClass("show");
        },1000);
    }, false);
    
    _mov.addEventListener("play", ()=>{
		console.log("play");
    }, false);
    
    _mov.addEventListener("pause", ()=>{
        console.log("pause");
        if(_mov.currentTime === _mov.duration){
            clearInterval(_playTimer);
            hideResult();
        }
    }, false);
    
    _mov.addEventListener("seeking", ()=>{
		console.log("seeking");
    }, false);
    
    _mov.addEventListener("playing", ()=>{
        console.log("playing");
        

        let result_get_flg = false;
        let result_disp_flg = false;

        _playTimer = setInterval(()=>{
            let currentTime = Math.floor(_mov.currentTime*100)/100;
            // console.log(currentTime)
            if(currentTime >= conf.result_get_time && !result_get_flg){
                console.log("結果取得："+currentTime)
                result_get_flg = true;
                getResult();
            }else if(currentTime >= conf.result_disp_time && !result_disp_flg){
                console.log("結果表示："+currentTime)
                result_disp_flg = true;
                dispResult();
            }
        },10);
    }, false);

    $("#cover .btn").on("click", function(e){
        setTimeout(()=>{
            $("#cover").addClass("hide");
        },200);
    });
}

/*
* 結果を取得する処理
*/
const getResult = () =>{
    console.log("getResult() ----")
    axios.get(result_json_url + '?' + CXHttpUtils.createCacheParam()).then((res)=>{
        console.log("結果json取得完了")
        console.log(res);
        console.log(res.data);
        // APIから取得したデータ
        let lawdata = res.data.data;

        console.log(lawdata)
        // TODO ソートする
        lawdata.sort((a, b)=>{
            // return a.point - b.point

            if( a.point < b.point ) return -1;
            if( a.point > b.point ) return 1;
            return 0;
        })
        console.log(lawdata)

        // 表示用データ
        let dispdata_1 = {data:[]};
        let dispdata_2 = {data:[]};

        const size_1 = 15;
        const size_2 = 30;

        
        let _rank = 1;
        for (let i=0; i<size_2; i++){
            if(i>size_2){
                break;
            }

            let _data = lawdata[i];

            if(!_data){
                break;
            }

            // ランクをつける
            if(i!==0 && lawdata.length > 1 && lawdata[i-1].point !== lawdata[i].point){
                _rank = i + 1;
            }
            _data.rank = _rank;

            _data.point = _data.point/100;
            
            // 表示用データ
            if( i < size_1 ){
                dispdata_1.data.push(_data);
            }else if( i <size_2 ){
                dispdata_2.data.push(_data);
            }

        }

        console.log(dispdata_1)
        console.log(dispdata_2)
        
        // $("#result_wrap ul li:nth-child(1) .result").html(result_template(dispdata_1));
        // $("#result_wrap ul li:nth-child(2) .result").html(result_template(dispdata_2));
        $("#result_wrap ul li.result_area .result").html(result_template(dispdata_1));
    })
}

/*
* 結果を表示する処理
*/
const dispResult = async () => {
    console.log("dispResult() ----")
    $("#result_wrap").addClass("disp");

    /*
    await sleep(2000);
    $("#result_wrap").addClass("transform");
    */

}

/*
* 結果を非表示にする処理
*/
const hideResult = () => {
    $("#result_wrap").removeClass("disp");
}

/*
* スリープ処理
*/
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}