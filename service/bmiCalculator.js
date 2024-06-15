const db = require('../server/dbFirebase');

const calculatorbmi = async (req, res) => {
    const { userId } = req.query;

    try {
        if (!userId) {
            return res.status(400).send({ message: 'Parameter userId tidak diberikan atau tidak valid.' });
        }

        const userQuery = db.collection('users').where('userId', '==', userId);
        const userSnapshot = await userQuery.get();

        if (userSnapshot.empty) {
            return res.status(400).send({ message: 'User ID yang anda masukan tidak terdaftar pada sistem kami.' });
        }

        const userData = userSnapshot.docs[0].data();
        const weight = userData.weight;
        const height = userData.height / 100;

        if (!weight && !height) {
            return res.status(400).send({ message: 'BMI tidak berhasil dihitung karena tidak ada data berat badan dan tinggi badan.' });
        } else if (!weight) {
            return res.status(400).send({ message: 'BMI tidak berhasil dihitung karena tidak ada data berat badan.' });
        } else if (!height) {
            return res.status(400).send({ message: 'BMI tidak berhasil dihitung karena tidak ada data tinggi badan.' });
        }

        const bmi = weight / (height * height);

        const roundedBMI = bmi.toFixed(1);


        let category;
        if (bmi < 18.5) {
            category = 'Berat badan kurang (Underweight)';
        } else if (bmi >= 18.5 && bmi < 25) {
            category = 'Berat badan normal';
        } else if (bmi >= 25 && bmi < 30) {
            category = 'Berat badan berlebih (Overweight)';
        } else {
            category = 'Obesitas';
        }

        res.status(200).send({ message: 'BMI berhasil dihitung.', bmi: roundedBMI, category });
    } catch (error) {
        console.error('Error calculating BMI:', error);
        res.status(500).send({ message: 'Terjadi masalah saat menghitung BMI.', error });
    }
};

  module.exports = {
    calculatorbmi
  };