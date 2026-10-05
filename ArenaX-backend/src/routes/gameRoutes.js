const express=require("express");
const dp=require("../config/db");
const router=express.Router();

router.get ("/",(req,res)=>{
  const sql=`
  SELECT  game_id,game_name,short_code
    FROM GAME
    ORDER BY game_name
  `;
  dp.query(sql, (err, result) => {
    if (err) {
      console.error(err);
     return res.status(500).json({ error: "FAILED TO FETCH GAMES" });
    } else {
      res.status(200).json({ game: result });
    }
  });
})

module.exports=router;