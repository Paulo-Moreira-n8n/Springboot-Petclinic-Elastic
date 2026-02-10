package org.springframework.samples.petclinic.util;

import io.swagger.v3.oas.models.media.Schema;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Configuration;

import java.util.Date;

@Configuration
public class OpenApiDateSchemaConfig {

    static {
		System.out.println("OpenApiDateSchemaConfig carregado!");
        Schema<String> dateSchema = new Schema<String>()
                .type("string")
                .example("2026/02/01")
                .pattern("\\d{4}/\\d{2}/\\d{2}")
                .description("Data no formato yyyy/MM/dd");

        // Força java.util.Date a ser documentado como string com barras,
        // ao invés de date-time ISO (2026-02-01T...)
        SpringDocUtils.getConfig().replaceWithSchema(Date.class, dateSchema);
    }
}