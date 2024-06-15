const db = require('../server/dbFirebase');

const saveRecommendedFoods = async (req, res) => {
  const { userId, foods, date } = req.body;

  // Validate input
  if (!userId || !Array.isArray(foods) || foods.length !== 3 || !date) {
    return res.status(400).send({ message: 'Harap kirim userId, tanggal, dan 3 objek makanan.' });
  }

  try {
    const batch = db.batch();

    foods.forEach(food => {
      const { id, calories, proteins, fat, carbohydrate, name, img, mealType } = food;

      // Check for missing food data
      if (!id || !calories || !proteins || !fat || !carbohydrate || !name || !img || !mealType) {
        throw new Error('Semua data makanan dan tipe makanan harus diisi.');
      }

      // Reference to the specific meal document for the user on a specific date
      const foodRef = db.collection('users')
                        .doc(userId)
                        .collection('history')
                        .doc(date)
                        .collection(mealType)
                        .doc(id);

      batch.set(foodRef, {
        id,
        userId,
        date,
        mealType,
        calories,
        proteins,
        fat,
        carbohydrate,
        name,
        img
      });
    });

    // Commit the batch operation
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
