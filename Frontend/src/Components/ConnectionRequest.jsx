import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addConnectionRequest } from "../utils/connectionRequestSlice";
import { removeConnectionRequest } from "../utils/connectionRequestSlice";
import { BASE_URL } from "../config";

export default function ConnectionRequest() {
    const [error, setError] = useState(null);
    const dispatch = useDispatch();
    const requests = useSelector((store) => store.requests);
    const [loading, setLoading] = useState(false);

    const connectionRequestFetch = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/request/received", {
                withCredentials: true,
            });
            dispatch(addConnectionRequest(res.data.data));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        connectionRequestFetch();
    }, []);

    const handleClick = async (status, _id) => {
        try {
            console.log("handleClick:", status, _id);
            const updateStatus = await axios.post(
                "/api/request/review/" + status + "/" + _id,
                {},
                { withCredentials: true }
            )
            dispatch(removeConnectionRequest(_id));
        } catch (err) {
            setError(err.message);
        }
    };

     if (loading) {
    return (
      <div className="mt-16 flex justify-center h-full text-lg text-white">
        Loading requests...
      </div>
    );
  }

    if (error) {
        return (
            <div className="mt-16 flex justify-center h-full text-lg text-white">
                Error loading Requests
            </div>
        );
    }

    if (!requests || requests.length == 0) {
        return (
            <div className="mt-16 flex justify-center h-full text-lg text-white">
                No connection request found
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center flex-col mt-5 mb-36 gap-7 smmb-24 caret-transparent px-4 sm:px-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Connection Requests
            </h1>
            {requests.map((ele) => {
                const { _id, firstName, lastName, age, gender, about, profilePhoto } = ele.fromUserId;
                return (
                    <div
                        key={_id}
                        className="w-full sm:w-4/5 md:w-[65%] rounded-2xl card bg-neutral text-neutral-content flex flex-col sm:flex-row items-center sm:items-start p-4 sm:p-5 gap-4 sm:gap-6 shadow-md"
                    >
                        <div className="flex-shrink-0">
                            <img
                                alt={firstName}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                                src={`${BASE_URL}${profilePhoto}`}
                            />
                        </div>

                        <div className="flex-1 text-center sm:text-left font-semibold  gap-1 space-y-1 flex flex-col items-center sm:items-start">
                            <h1 className="text-base sm:text-lg font-semibold mb-2">
                                {firstName + " " + lastName}
                            </h1>
                            {age && gender && (
                                <h2 className="text-sm sm:text-base w-max py-1 px-3 rounded-2xl  font-light caret-transparent select-none bg-gray-700 mb-2 ">{age + ", " + gender}</h2>
                            )}
                            {about && <h2 className="text-sm sm:text-base">{about}</h2>}
                        </div>

                        <div className="flex gap-3 sm:gap-5 mt-3 sm:mt-0">
                            <button
                                className="px-4 py-2 border-2 border-blue-500 hover:border-blue-600 hover:text-blue-600  rounded-lg text-blue-400 text-sm sm:text-base cursor-pointer"
                                onClick={() => handleClick("accepted", _id)}
                            >
                                Accept
                            </button>
                            <button
                                className="px-4 py-2 border-2 border-pink-500 hover:border-pink-700 hover:text-pink-700 rounded-lg text-pink-500 text-sm sm:text-base cursor-pointer"
                                onClick={() => handleClick("rejected", _id)}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
