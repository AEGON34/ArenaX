const db = require("../config/db");

function requireAuth(req, res, next){
    if(!req.session.userId){
        return res.status(401).json({
            message: "Authentication required"
        });
    }
    next();
}
function requireRole(requiredRole){

    return(req,res,next)=>{
        if(!req.session.userId){
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const sql =`
        SELECT role FROM USER WHERE user_id = ?
        `
        db.query(
            sql,[req.session.userId],(err,results)=>{
                if(err){
                    console.log(err);
                    return res.status(500).json({
                        message: "Failed to check user role"
                    });
                }
                if(results.length === 0){
                    return res.status(404).json({
                        message: "User not found"
                    });
                }
                const userRole = results[0].role;
                if(userRole !== requiredRole){
                    return res.status(403).json({
                        message: "Access denied"
                    });
                }
                next();
            }
        )

    }

}


module.exports = {
    requireAuth,
    requireRole
}