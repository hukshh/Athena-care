"""
AthenaCare AI — Hospital & Doctor Database Seeder
Seeds MongoDB with realistic hospital and doctor data
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import os

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "athenacare"

HOSPITALS = [
    {
        "name": "Bumrungrad International Hospital",
        "country": "Thailand",
        "city": "Bangkok",
        "address": "33 Sukhumvit 3, Wattana, Bangkok 10110",
        "rating": 4.9,
        "reviews_count": 12840,
        "specialty": "Multi-specialty",
        "specialties": ["Cardiology", "Orthopedics", "Oncology", "Neurology", "Transplant"],
        "accreditation": "JCI Accredited",
        "established": 1980,
        "beds": 580,
        "success_rate": 96.8,
        "avg_cost_usd": {"min": 15000, "max": 30000},
        "duration_days": {"min": 7, "max": 14},
        "languages": ["English", "Thai", "Arabic", "Chinese", "Japanese"],
        "international_patients_per_year": 1100000,
        "highlights": [
            "World-class cardiac ICU",
            "Robotic surgery available",
            "International patient center",
            "Telemedicine consultations",
        ],
        "conditions_treated": [
            "Coronary Artery Disease", "Heart Failure", "Arrhythmia",
            "Knee Osteoarthritis", "Hip Dysplasia", "Spine Disorders",
            "Breast Cancer", "Lung Cancer", "Colorectal Cancer",
        ],
        "emergency_care": True,
        "website": "https://www.bumrungrad.com",
        "phone": "+66-2-066-8888",
        "email": "info@bumrungrad.com",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Apollo Hospitals",
        "country": "India",
        "city": "Chennai",
        "address": "21 Greams Lane, Off Greams Road, Chennai 600006",
        "rating": 4.8,
        "reviews_count": 28500,
        "specialty": "Multi-specialty",
        "specialties": ["Cardiology", "Oncology", "Transplant", "Neurology", "Orthopedics"],
        "accreditation": "JCI Accredited",
        "established": 1983,
        "beds": 700,
        "success_rate": 97.2,
        "avg_cost_usd": {"min": 8000, "max": 15000},
        "duration_days": {"min": 10, "max": 21},
        "languages": ["English", "Hindi", "Tamil", "Telugu", "Malayalam"],
        "international_patients_per_year": 2300000,
        "highlights": [
            "Largest cardiac program in Asia",
            "TAVR procedures available",
            "Telemedicine support",
            "Dedicated international patient services",
        ],
        "conditions_treated": [
            "Coronary Artery Disease", "Valve Disease", "Congenital Heart Disease",
            "Breast Cancer", "Prostate Cancer", "Leukemia",
            "Liver Cirrhosis", "Kidney Failure",
        ],
        "emergency_care": True,
        "website": "https://www.apollohospitals.com",
        "phone": "+91-44-2829-3333",
        "email": "international@apollohospitals.com",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Anadolu Medical Center",
        "country": "Turkey",
        "city": "Istanbul",
        "address": "Cumhuriyet Mah. 2255 Sok. No:3, Gebze, Kocaeli",
        "rating": 4.9,
        "reviews_count": 9200,
        "specialty": "Multi-specialty",
        "specialties": ["Oncology", "Cardiology", "Neurology", "Orthopedics", "Transplant"],
        "accreditation": "JCI Accredited",
        "established": 2005,
        "beds": 250,
        "success_rate": 95.5,
        "avg_cost_usd": {"min": 12000, "max": 25000},
        "duration_days": {"min": 7, "max": 14},
        "languages": ["English", "Turkish", "Arabic", "Russian", "German"],
        "international_patients_per_year": 800000,
        "highlights": [
            "Harvard Medical International affiliate",
            "Minimally invasive surgery",
            "Luxury patient suites",
            "Proton therapy available",
        ],
        "conditions_treated": [
            "Brain Tumors", "Lung Cancer", "Breast Cancer",
            "Coronary Artery Disease", "Stroke", "Epilepsy",
        ],
        "emergency_care": True,
        "website": "https://www.anadolumedicalcenter.com",
        "phone": "+90-262-678-5000",
        "email": "international@anadolumedicalcenter.com",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Gleneagles Hospital",
        "country": "Singapore",
        "city": "Singapore",
        "address": "6A Napier Road, Singapore 258500",
        "rating": 4.8,
        "reviews_count": 7600,
        "specialty": "Multi-specialty",
        "specialties": ["Cardiology", "Orthopedics", "Oncology", "Neurology", "Gastroenterology"],
        "accreditation": "JCI Accredited",
        "established": 1994,
        "beds": 380,
        "success_rate": 96.1,
        "avg_cost_usd": {"min": 25000, "max": 45000},
        "duration_days": {"min": 8, "max": 15},
        "languages": ["English", "Mandarin", "Malay", "Tamil"],
        "international_patients_per_year": 950000,
        "highlights": [
            "Singapore's premier cardiac center",
            "Advanced EP lab",
            "Integrated care model",
            "Robotic surgery",
        ],
        "conditions_treated": [
            "Coronary Artery Disease", "Atrial Fibrillation",
            "Knee Replacement", "Hip Replacement",
            "Colorectal Cancer", "Liver Cancer",
        ],
        "emergency_care": True,
        "website": "https://www.gleneagles.com.sg",
        "phone": "+65-6473-7222",
        "email": "international@gleneagles.com.sg",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Fortis Escorts Heart Institute",
        "country": "India",
        "city": "New Delhi",
        "address": "Okhla Road, New Delhi 110025",
        "rating": 4.7,
        "reviews_count": 15200,
        "specialty": "Cardiology",
        "specialties": ["Cardiology", "Cardiac Surgery", "Electrophysiology"],
        "accreditation": "NABH Accredited",
        "established": 1988,
        "beds": 310,
        "success_rate": 94.8,
        "avg_cost_usd": {"min": 7000, "max": 12000},
        "duration_days": {"min": 10, "max": 18},
        "languages": ["English", "Hindi"],
        "international_patients_per_year": 1500000,
        "highlights": [
            "Dedicated heart hospital",
            "Affordable excellence",
            "Experienced cardiac team",
            "24/7 cardiac emergency",
        ],
        "conditions_treated": [
            "Coronary Artery Disease", "Heart Failure", "Valve Disease",
            "Congenital Heart Disease", "Arrhythmia",
        ],
        "emergency_care": True,
        "website": "https://www.fortishealthcare.com",
        "phone": "+91-11-4713-5000",
        "email": "international@fortishealthcare.com",
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Medicana Health Group",
        "country": "Turkey",
        "city": "Istanbul",
        "address": "Beylikdüzü, Istanbul",
        "rating": 4.7,
        "reviews_count": 6800,
        "specialty": "Multi-specialty",
        "specialties": ["Transplant", "Oncology", "Cardiology", "Orthopedics"],
        "accreditation": "JCI Accredited",
        "established": 1992,
        "beds": 450,
        "success_rate": 94.2,
        "avg_cost_usd": {"min": 10000, "max": 22000},
        "duration_days": {"min": 7, "max": 21},
        "languages": ["English", "Turkish", "Arabic", "Russian"],
        "international_patients_per_year": 600000,
        "highlights": [
            "Organ transplant center",
            "Hair transplant center",
            "Dental tourism packages",
            "All-inclusive packages",
        ],
        "conditions_treated": [
            "Liver Failure", "Kidney Failure", "Bone Marrow Disorders",
            "Various Cancers", "Orthopedic Conditions",
        ],
        "emergency_care": True,
        "website": "https://www.medicana.com.tr",
        "phone": "+90-212-444-7-888",
        "email": "international@medicana.com.tr",
        "created_at": datetime.utcnow(),
    },
]

DOCTORS = [
    {
        "name": "Dr. Priya Sharma",
        "specialty": "Interventional Cardiologist",
        "hospital": "Apollo Hospitals",
        "hospital_city": "Chennai",
        "country": "India",
        "rating": 4.9,
        "reviews_count": 2840,
        "experience_years": 22,
        "education": "AIIMS Delhi, Fellowship at Cleveland Clinic",
        "procedures": ["CABG", "PTCA", "Valve Replacement", "TAVR", "Angioplasty"],
        "languages": ["English", "Hindi", "Tamil"],
        "consultation_fee_usd": 80,
        "availability": "Available in 3 days",
        "bio": "Dr. Sharma is a leading interventional cardiologist with 22 years of experience. She has performed over 5,000 cardiac procedures with exceptional outcomes.",
        "publications": 45,
        "awards": ["Best Cardiologist Award 2022", "Excellence in Cardiac Care 2021"],
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Dr. Mehmet Yilmaz",
        "specialty": "Cardiac Surgeon",
        "hospital": "Anadolu Medical Center",
        "hospital_city": "Istanbul",
        "country": "Turkey",
        "rating": 4.8,
        "reviews_count": 1920,
        "experience_years": 18,
        "education": "Istanbul University, Fellowship at Johns Hopkins",
        "procedures": ["Open Heart Surgery", "Bypass Surgery", "Heart Transplant", "LVAD"],
        "languages": ["English", "Turkish", "German"],
        "consultation_fee_usd": 120,
        "availability": "Available in 1 week",
        "bio": "Dr. Yilmaz specializes in complex cardiac surgeries and has trained at Johns Hopkins. Known for exceptional patient outcomes.",
        "publications": 32,
        "awards": ["Turkish Cardiac Surgery Excellence Award 2023"],
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Dr. Somchai Pattanapong",
        "specialty": "Cardiologist",
        "hospital": "Bumrungrad International",
        "hospital_city": "Bangkok",
        "country": "Thailand",
        "rating": 4.9,
        "reviews_count": 3100,
        "experience_years": 25,
        "education": "Mahidol University, Fellowship at Mayo Clinic",
        "procedures": ["Echocardiography", "Cardiac Catheterization", "Pacemaker Implant"],
        "languages": ["English", "Thai", "Japanese"],
        "consultation_fee_usd": 150,
        "availability": "Available tomorrow",
        "bio": "Dr. Pattanapong is one of Thailand's most respected cardiologists with 25 years of experience.",
        "publications": 58,
        "awards": ["Thailand Medical Excellence Award 2022"],
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Dr. Rajesh Kumar",
        "specialty": "Orthopedic Surgeon",
        "hospital": "Fortis Healthcare",
        "hospital_city": "New Delhi",
        "country": "India",
        "rating": 4.7,
        "reviews_count": 4200,
        "experience_years": 20,
        "education": "AIIMS Delhi, Fellowship at Hospital for Special Surgery NY",
        "procedures": ["Knee Replacement", "Hip Replacement", "Spine Surgery", "Sports Medicine"],
        "languages": ["English", "Hindi"],
        "consultation_fee_usd": 60,
        "availability": "Available in 5 days",
        "bio": "Dr. Kumar is a pioneer in minimally invasive joint replacement surgery with over 8,000 successful procedures.",
        "publications": 28,
        "awards": ["Best Orthopedic Surgeon India 2023"],
        "created_at": datetime.utcnow(),
    },
    {
        "name": "Dr. Sarah Chen",
        "specialty": "Oncologist",
        "hospital": "Gleneagles Hospital",
        "hospital_city": "Singapore",
        "country": "Singapore",
        "rating": 4.8,
        "reviews_count": 1850,
        "experience_years": 16,
        "education": "NUS Medicine, Fellowship at MD Anderson Cancer Center",
        "procedures": ["Chemotherapy", "Immunotherapy", "Targeted Therapy", "Bone Marrow Transplant"],
        "languages": ["English", "Mandarin", "Cantonese"],
        "consultation_fee_usd": 200,
        "availability": "Available in 2 days",
        "bio": "Dr. Chen is a leading oncologist specializing in breast and lung cancer with training from MD Anderson.",
        "publications": 42,
        "awards": ["Singapore Medical Excellence Award 2022"],
        "created_at": datetime.utcnow(),
    },
]


async def seed_database():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    print("🌱 Seeding AthenaCare AI database...")

    # Clear existing data
    await db.hospitals.delete_many({})
    await db.doctors.delete_many({})
    print("   Cleared existing hospital/doctor data")

    # Insert hospitals
    result = await db.hospitals.insert_many(HOSPITALS)
    print(f"   ✅ Inserted {len(result.inserted_ids)} hospitals")

    # Insert doctors
    result = await db.doctors.insert_many(DOCTORS)
    print(f"   ✅ Inserted {len(result.inserted_ids)} doctors")

    # Create demo users using bcrypt directly (avoids passlib/bcrypt version conflict)
    import bcrypt as _bcrypt

    def hash_pw(password: str) -> str:
        return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

    demo_users = [
        {
            "full_name": "Demo Patient",
            "email": "demo@athenacare.ai",
            "password_hash": hash_pw("demo123456"),
            "role": "patient",
            "nationality": "American",
            "is_active": True,
            "created_at": datetime.utcnow(),
        },
        {
            "full_name": "Admin User",
            "email": "admin@athenacare.ai",
            "password_hash": hash_pw("admin123456"),
            "role": "admin",
            "nationality": "American",
            "is_active": True,
            "created_at": datetime.utcnow(),
        },
    ]

    for user in demo_users:
        existing = await db.users.find_one({"email": user["email"]})
        if not existing:
            await db.users.insert_one(user)
            print(f"   ✅ Created user: {user['email']}")
        else:
            print(f"   ℹ️  User already exists: {user['email']}")

    print("\n🎉 Database seeded successfully!")
    print("\nDemo accounts:")
    print("  Patient: demo@athenacare.ai / demo123456")
    print("  Admin:   admin@athenacare.ai / admin123456")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
