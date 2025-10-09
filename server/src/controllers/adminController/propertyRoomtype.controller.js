const { PrismaClient } = require('@prisma/client');
const { get } = require('../../routes/adminRoutes/property.routes');
const prisma = new PrismaClient();

const propertyRoomtypeController = {

    getPropertyRoomTypes: async (req, res) => {
         const { propertyId } = req.query;

         try{
            const propertyRoomtypes = await prisma.propertyRoomType.findMany({
                where: { propertyId: propertyId },
                select: {
                    id: true,
                }
            })
            res.json(propertyRoomtypes);
         }catch(error){
            console.error('Error fetching room types:', error);
            res.status(500).json({ error: 'Internal server error' });
         }
    }
}

module.exports = propertyRoomtypeController;