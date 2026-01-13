import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CreateProductButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "xl" | "icon";
}

export const CreateProductButton = ({ 
  className, 
  size = "default" 
}: CreateProductButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/admin/products/new");
  };

  return (
    <Button
      onClick={handleClick}
      variant="default"
      size={size}
      className={className}
    >
      <Plus className="h-4 w-4" />
      Tạo sản phẩm mới
    </Button>
  );
};
