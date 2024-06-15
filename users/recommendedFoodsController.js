const db = require('../server/dbFirebase');

const saveRecommendedFoods = async (req, res) => {
  const { userId, foods } = req.body;

  // Validasi input
  if (!userId || !Array.isArray(foods) || foods.length !== 3) {
    return res.status(400).send({ message: 'Harap kirim userId dan 3 objek makanan.' });
  }

  try {
    const batch = db.batch();

    foods.forEach(food => {
      const { id, calories, proteins, fat, carbohydrate, name, img } = food;

      if (!id || !calories || !proteins || !fat || !carbohydrate || !name || !img) {
        throw new Error('Semua data makanan harus diisi.');
      }

      const foodRef = db.collection('users').doc(userId).collection('recommended_foods').doc(id);
      batch.set(foodRef, {
        id,
        userId,
        calories,
        proteins,
        fat,
        carbohydrate,
        name,
        img
      });
    });

    await batch.commit();
    res.status(201).send({ message: 'Makanan berhasil disimpan.' });
  } catch (error) {
    console.error('Error saving recommended foods:', error);
    res.status(500).send({ message: 'Terjadi masalah saat menyimpan makanan.', error: error.message });
  }
};

module.exports = {
  saveRecommendedFoods
};
