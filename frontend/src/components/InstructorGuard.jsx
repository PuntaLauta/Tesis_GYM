import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getInstructor } from "../services/instructores";
import InactiveInstructorBanner from "./InactiveInstructorBanner";

export default function InstructorGuard({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user || user.rol !== "instructor" || !user.instructor_id) {
        setLoading(false);
        setIsInactive(false);
        return;
      }

      try {
        const data = await getInstructor(user.instructor_id);
        const instructor = data?.data;

        if (!instructor) {
          setIsInactive(true);
        } else {
          setIsInactive(instructor.activo !== 1);
        }
      } catch (error) {
        console.error("Error al verificar estado del instructor:", error);
        setIsInactive(true);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (isInactive) {
    return <InactiveInstructorBanner />;
  }

  return children;
}

