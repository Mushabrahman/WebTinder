import { useState, useRef } from "react";
import UserCard from "./userCard";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import axios from "axios";
import { toast } from "react-toastify";

function EditProfile({ user }) {
    const [firstName, setFirstName] = useState(user?.user?.firstName || "Guest");
    const [lastName, setLastName] = useState(user?.user?.lastName || "");
    const [about, setAbout] = useState(user?.user?.about || "");
    const [skills, setSkills] = useState(user?.user?.skills || "");
    const [gender, setGender] = useState(user?.user?.gender || "male");
    const [age, setAge] = useState(user?.user?.age || "");
    const [profilePhoto, setProfilePhoto] = useState(user?.user?.profilePhoto || "");
    const [selectedFile, setSelectedFile] = useState(null);

    const dispatch = useDispatch();
    const fileInputRef = useRef(null);

    const handleIconClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setProfilePhoto(URL.createObjectURL(file)); // preview
        }
    };

    const editProfileFetch = async () => {
        try {
            const formData = new FormData();
            formData.append("firstName", firstName);
            formData.append("lastName", lastName);
            formData.append("about", about);
            formData.append("skills", skills);
            formData.append("gender", gender);
            formData.append("age", age);

            if (selectedFile) {
                formData.append("profilePhoto", selectedFile);
            }

            const res = await axios.patch("/api/editUser", formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            });

            dispatch(addUser(res.data));
            toast.success("Profile updated successfully");
        } catch (err) {
            toast.error("Error updating profile: " + err.message);
        }
    };

    return (
        <div className="flex flex-col-reverse md:flex-row justify-center items-center md:items-start mx-auto mt-12 mb-30 gap-10 -z-10">
            <div className="card bg-neutral text-neutral-content flex-col items-center w-[310px] sm:w-96 shadow-sm">
                <h1 className="text-center pt-8 font-semibold text-xl">Edit Profile!</h1>

                <div className="flex-col pt-5 w-[260px] sm:w-[273px]">
                    <label className="font-semibold caret-transparent">First Name</label>
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        className="input mt-2 text-black font-semibold pl-2"
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>

                <div className="flex-col pt-5 w-[260px] sm:w-[273px]">
                    <label className="font-semibold caret-transparent">Last Name</label>
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        className="input mt-2 text-black font-semibold pl-2"
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>

                <div className="flex-col pt-5 w-[260px] sm:w-[273px] relative">
                    <label className="font-semibold caret-transparent  ">About</label>
                    <span className="absolute right-0 top-0 text-sm text-gray-500 mt-5"> {about.length}/50 </span>
                    <input
                        type="text"
                        placeholder="About"
                        value={about}
                        maxLength={50}
                        className="input mt-2 text-black font-semibold pl-2"
                        onChange={(e) => setAbout(e.target.value)}
                    />
                </div>

                <div className="flex-col pt-5 w-[260px] sm:w-[273px]">
                    <label className="font-semibold caret-transparent">Gender</label>
                    <select
                        value={gender}
                        className="input mt-2 text-black font-semibold pl-2 cursor-pointer"
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="male">male</option>
                        <option value="female">female</option>
                    </select>
                </div>

                <div className="flex-col pt-5 w-[260px] sm:w-[273px]">
                    <label className="font-semibold caret-transparent">Age</label>
                    <input
                        type="number"
                        placeholder="Age"
                        value={age}
                        maxLength={2}
                        className="input mt-2 text-black font-semibold pl-2"
                        onChange={(e) => setAge(e.target.value)}
                    />
                </div>

                <div className="flex-col pt-5 w-[260px] sm:w-[273px]">
                    <label className="font-semibold caret-transparent">Skills</label>
                    <input
                        type="text"
                        placeholder="Skills"
                        value={skills}
                        className="input mt-2 text-black font-semibold pl-2"
                        onChange={(e) => setSkills(e.target.value)}
                    />
                </div>

                <div className="flex-col pt-5 items-center text-center caret-transparent">
                    <label className="font-semibold caret-transparent">Profile Picture</label>

                    <div className="mt-2 relative w-full flex justify-center cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        <div
                            className="w-32 h-32 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center cursor-pointer bg-gray-100"
                            onClick={handleIconClick}
                        >
                            {profilePhoto ? (
                                <img
                                    src={profilePhoto}
                                    alt="Profile"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <span className="text-gray-500 text-3xl caret-transparent">+</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-body items-center text-center">
                    <button type="button" className="btn btn-primary" onClick={editProfileFetch}>
                        Save Profile
                    </button>
                </div>
            </div>

            <UserCard
                user={{ firstName, lastName, age, about, skills, gender, profilePhoto }}
            />
        </div>
    );
}

export default EditProfile;
