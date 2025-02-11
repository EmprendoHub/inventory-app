import React from "react";
import FormHeader from "../../_components/FormHeader";
import ItemGroupForm from "../../articulos/_components/ItemGroupForm";

export default function NewGroup() {
  return (
    <div>
      <FormHeader title={"Grupo"} />
      <ItemGroupForm />
    </div>
  );
}
