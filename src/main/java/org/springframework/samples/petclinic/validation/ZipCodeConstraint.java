package org.springframework.samples.petclinic.validation;

import javax.validation.Constraint;
import java.lang.annotation.Documented;
import javax.validation.Payload;
import java.lang.annotation.Target;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;


@Documented
@Constraint(validatedBy = ZipCodeValidator.class)
@Target( { ElementType.METHOD, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
public @interface ZipCodeConstraint {

    String message() default "Invalid zip code";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
